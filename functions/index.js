const functions = require('firebase-functions/v1');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
  escapeTelegramHtml,
  formatTrainingRequestMessage,
} = require('./telegramFormat');

initializeApp();
const db = getFirestore();

// Cấu hình bot Telegram.
//
// CẢNH BÁO LỊCH SỬ: token cũ từng nằm cứng trong file này và đã bị đẩy lên repo
// công khai — vẫn đọc được trong lịch sử git. Token đó đã được thu hồi qua
// @BotFather ngày 16/08/2026. Không bao giờ đặt token thẳng vào mã.
//
// Đặt token mới:
//   firebase functions:secrets:set TELEGRAM_BOT_TOKEN
//   firebase functions:secrets:set TELEGRAM_CHAT_ID
//
// PHẢI đọc bên trong hàm, không đọc ở cấp module.
//
// Secret chỉ được nạp vào biến môi trường KHI HÀM CHẠY, còn phần thân file này
// được nạp lúc khởi tạo — đọc ở đây thì lấy về chuỗi rỗng, và cái rỗng đó bị
// giữ nguyên suốt vòng đời tiến trình. Kết quả: đặt token đúng mà thông báo
// vẫn im lặng, không báo lỗi gì.
//
// Vẫn đọc functions.config() làm phương án lùi cho cấu hình cũ, nhưng cách đó
// đã bị Firebase khai tử, nên hãy chuyển hẳn sang secrets.
const TEN_SECRET_TELEGRAM = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];

const layCauHinhTelegram = () => {
  let cauHinhCu = {};
  try {
    cauHinhCu = (functions.config && functions.config().telegram) || {};
  } catch {
    // functions.config() không dùng được ở môi trường mới — bỏ qua.
  }
  return {
    token: process.env.TELEGRAM_BOT_TOKEN || cauHinhCu.bot_token || '',
    chatId: process.env.TELEGRAM_CHAT_ID || cauHinhCu.chat_id || '',
  };
};

/**
 * Kiểm tra người gọi có phải admin không (đọc admins/{uid} bằng Admin SDK).
 */
async function assertAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Cần đăng nhập');
  }
  const snap = await db.collection('admins').doc(context.auth.uid).get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Chỉ quản trị viên mới dùng được chức năng này');
  }
}

/**
 * Kiểm tra người gọi là admin HOẶC đối tác đã được duyệt.
 *
 * Dùng cho việc gửi email: tạo một tài khoản Google chỉ mất 10 giây, nên
 * "đã đăng nhập" gần như tương đương "bất kỳ ai trên Internet".
 */
async function assertAdminOrApprovedPartner(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Cần đăng nhập');
  }
  const uid = context.auth.uid;
  const adminSnap = await db.collection('admins').doc(uid).get();
  if (adminSnap.exists) return;

  const partnerSnap = await db.collection('partners').doc(uid).get();
  if (partnerSnap.exists && partnerSnap.data().status === 'approved') return;

  throw new functions.https.HttpsError(
    'permission-denied',
    'Chỉ quản trị viên hoặc đối tác đã được duyệt mới gửi được email'
  );
}

/**
 * Send message to Telegram
 */
async function sendTelegramMessage(message) {
  // Đọc cấu hình tại thời điểm gửi, không dùng biến đọc sẵn ở đầu file.
  const { token, chatId } = layCauHinhTelegram();

  if (!token || !chatId) {
    throw new Error(
      'Chưa cấu hình TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID. Đặt bằng: firebase functions:secrets:set TELEGRAM_BOT_TOKEN'
    );
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
    console.log('Telegram notification sent successfully');
  } catch (error) {
    // Không in error.message thô: khi Telegram trả lỗi, axios đưa cả URL vào
    // thông điệp — mà URL đó có chứa token bot, sẽ nằm lại trong log.
    const maLoi = error.response?.status;
    const moTa = error.response?.data?.description;
    console.error(
      `Error sending Telegram notification: HTTP ${maLoi || '?'}${moTa ? ' - ' + moTa : ''}`
    );
    throw new Error(`Telegram trả lỗi ${maLoi || 'không rõ'}`);
  }
}

/**
 * Cloud Function V1: Triggered when a new training request is created
 */
exports.notifyNewTrainingRequest = functions
  // Khai báo secret thì Firebase mới nạp chúng vào biến môi trường lúc hàm chạy.
  // Thiếu dòng này là token đặt đúng nhưng hàm vẫn không thấy, và thông báo
  // yêu cầu mới im lặng biến mất.
  .runWith({ secrets: TEN_SECRET_TELEGRAM })
  .firestore.document('trainingRequests/{requestId}')
  .onCreate(async (snapshot, context) => {
    const requestData = snapshot.data();
    const requestId = context.params.requestId;

    console.log('New training request created:', requestId);

    if (!TELEGRAM_CHAT_ID) {
      console.warn('TELEGRAM_CHAT_ID not configured. Skipping notification.');
      return;
    }

    try {
      const message = formatTrainingRequestMessage(requestData);
      await sendTelegramMessage(message);
      console.log('Notification sent for request:', requestId);
    } catch (error) {
      console.error('Error in notifyNewTrainingRequest:', error);
    }
  });

/**
 * Cloud Function V1: Gửi email (thay cho việc client ghi thẳng vào /mail).
 *
 * Rules đã khoá collection `mail` với client. Hàm này kiểm tra người gọi đã
 * đăng nhập rồi mới ghi bằng Admin SDK (bỏ qua rules), để extension Trigger
 * Email gửi đi. Nhờ vậy không còn ai gửi được email ẩn danh từ tên miền này.
 */
exports.sendAppEmail = functions.https.onCall(async (data, context) => {
  // TRƯỚC ĐÂY chỉ kiểm "đã đăng nhập". Vì người gọi tự đặt người nhận, tiêu đề
  // và toàn bộ nội dung HTML (tối đa 50 địa chỉ mỗi lần, không giới hạn số lần),
  // bất kỳ ai lập một tài khoản Google cũng biến hệ thống thành máy gửi thư rác
  // đứng tên miền này — hậu quả nặng nhất là tên miền bị đưa vào danh sách đen.
  //
  // Hai nơi gọi hợp lệ đều đã đăng nhập sẵn: đối tác gửi báo giá (QuoteForm) và
  // admin duyệt/từ chối đối tác (useAdminActions), nên siết vào đúng hai vai này
  // không làm vỡ tính năng nào.
  await assertAdminOrApprovedPartner(context);

  const { to, subject, html, text } = data || {};

  const recipients = Array.isArray(to) ? to : [to];
  const validEmail = (e) => typeof e === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

  if (recipients.length === 0 || recipients.length > 50 || !recipients.every(validEmail)) {
    throw new functions.https.HttpsError('invalid-argument', 'Danh sách người nhận không hợp lệ');
  }
  if (typeof subject !== 'string' || subject.length === 0 || subject.length > 300) {
    throw new functions.https.HttpsError('invalid-argument', 'Tiêu đề không hợp lệ');
  }
  if (typeof html !== 'string' || html.length === 0 || html.length > 200000) {
    throw new functions.https.HttpsError('invalid-argument', 'Nội dung không hợp lệ');
  }

  const docRef = await db.collection('mail').add({
    to: recipients,
    message: { subject, html, ...(text ? { text } : {}) },
    createdAt: new Date(),
    // Ghi lại ai yêu cầu gửi, để lần theo khi có lạm dụng
    requestedBy: context.auth.uid,
  });

  return { id: docRef.id };
});

/**
 * Cloud Function V1: Test Telegram notification
 */
exports.testTelegramNotification = functions
  .runWith({ secrets: TEN_SECRET_TELEGRAM })
  .https.onCall(async (data, context) => {
  // Chỉ admin: trước đây mọi tài khoản đã đăng nhập đều bơm được tin nhắn rác
  // vào Telegram của chủ hệ thống, không giới hạn số lần.
  await assertAdmin(context);

  const testMessage = `
🧪 <b>TEST NOTIFICATION</b>

Đây là tin nhắn thử nghiệm từ SafetyConnect Bot.

✅ Bot đang hoạt động bình thường!

👤 <b>Tested by:</b> ${escapeTelegramHtml(context.auth.token.email) || 'Unknown'}

⏰ ${new Date().toLocaleString('vi-VN')}
  `.trim();

  try {
    await sendTelegramMessage(testMessage);
    return { success: true, message: 'Test notification sent successfully' };
  } catch (error) {
    console.error('Test notification failed:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send test notification: ' + error.message);
  }
});

/**
 * Cloud Function V1: Generate blog post using Gemini AI
 */
exports.generateBlogPost = functions.runWith({ secrets: ['GEMINI_API_KEY'] }).https.onCall(async (data, context) => {
  // Chỉ admin: hàm này gọi Gemini bằng khoá của chủ hệ thống, nên mở cho mọi
  // tài khoản đã đăng nhập đồng nghĩa với việc người lạ tiêu tiền AI của chủ.
  await assertAdmin(context);

  const { topic, category, keywords } = data;

  if (!topic) {
    throw new functions.https.HttpsError('invalid-argument', 'Topic is required');
  }

  console.log('Generating blog post for topic:', topic);

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new functions.https.HttpsError('failed-precondition', 'GEMINI_API_KEY secret is not set on the server.');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Bạn là một chuyên gia về An toàn Lao động tại Việt Nam, đồng thời là chuyên gia SEO. Hãy viết một bài blog chuyên nghiệp, chi tiết, hữu ích và TỐI ƯU SEO về chủ đề sau:

Chủ đề: ${topic}
Danh mục: ${category || 'An toàn lao động'}
${keywords ? `Từ khóa chính: ${keywords}` : ''}

YÊU CẦU NỘI DUNG:
1. Viết bằng tiếng Việt chuẩn, chuyên nghiệp
2. Nội dung phải chính xác, dựa trên quy định pháp luật Việt Nam (Luật An toàn Lao động, các Nghị định, Thông tư liên quan)
3. Độ dài: 800-1200 từ
4. Bao gồm: Mở bài giới thiệu vấn đề → Nội dung chính với tiểu mục → Kết luận và khuyến nghị
5. Đưa ra ví dụ thực tế nếu có thể

YÊU CẦU SEO (QUAN TRỌNG):
1. TIÊU ĐỀ (title): 50-60 ký tự, chứa từ khóa chính ở đầu, hấp dẫn và rõ ràng
2. TÓM TẮT (excerpt): 150-160 ký tự, mô tả hấp dẫn kêu gọi hành động, chứa từ khóa chính
3. CẤU TRÚC HEADING: Dùng đúng 1 <h2> cho tiêu đề phần chính, <h3> cho tiểu mục. KHÔNG dùng <h1> (đã dùng cho title)
4. MẬT ĐỘ TỪ KHÓA: Từ khóa chính xuất hiện tự nhiên 3-5 lần trong bài, từ khóa phụ 1-2 lần
5. ĐOẠN ĐẦU TIÊN: Phải chứa từ khóa chính trong 100 từ đầu
6. TAGS: 5-7 tags, bao gồm cả long-tail keywords, viết bằng tiếng Việt có dấu
7. FORMAT HTML: Dùng <p>, <strong>, <em>, <ul>, <ol>, <li>, <h2>, <h3>, <blockquote>
8. NỘI DUNG: Tự nhiên, không nhồi keyword, cung cấp giá trị thực cho người đọc

Trả về theo định dạng JSON với cấu trúc sau:
{
  "title": "Tiêu đề SEO tối ưu (50-60 ký tự, chứa keyword chính)",
  "excerpt": "Meta description hấp dẫn (150-160 ký tự, chứa keyword + CTA)",
  "content": "Nội dung đầy đủ với HTML formatting, heading hierarchy đúng chuẩn SEO",
  "tags": ["từ khóa chính", "từ khóa phụ 1", "long-tail keyword 1", "long-tail keyword 2", "từ khóa liên quan"],
  "suggestedCategory": "Danh mục phù hợp nhất"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let blogData;
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      blogData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      blogData = {
        title: topic,
        excerpt: text.substring(0, 200) + '...',
        content: text,
        tags: keywords ? keywords.split(',').map(k => k.trim()) : [],
        suggestedCategory: category || 'An toàn lao động'
      };
    }

    console.log('Blog post generated successfully');
    return {
      success: true,
      data: blogData
    };

  } catch (error) {
    console.error('Error generating blog post:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate blog post: ' + error.message);
  }
});

/**
 * Cloud Function V1: AI Blog Helper - Improve existing content, generate title/excerpt/tags
 */
exports.improveBlogContent = functions.runWith({ secrets: ['GEMINI_API_KEY'] }).https.onCall(async (data, context) => {
  // Chỉ admin — cùng lý do với generateBlogPost: tiền gọi Gemini là của chủ.
  await assertAdmin(context);

  const { action, content, context: blogContext } = data;

  if (!action) {
    throw new functions.https.HttpsError('invalid-argument', 'Action is required');
  }

  console.log('Improving blog content, action:', action);

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new functions.https.HttpsError('failed-precondition', 'GEMINI_API_KEY secret is not set on the server.');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let prompt = '';

    switch (action) {
      case 'improve_content':
        prompt = `Bạn là chuyên gia An toàn Lao động. Hãy cải thiện nội dung blog sau:

${content}

Yêu cầu:
- Sửa lỗi chính tả, ngữ pháp
- Cải thiện cấu trúc câu, đoạn văn
- Tối ưu SEO tự nhiên
- Giữ nguyên ý nghĩa và tone chuyên nghiệp
- Trả về nội dung đã cải thiện (với HTML formatting)`;
        break;

      case 'generate_title':
        prompt = `Dựa vào nội dung blog về An toàn Lao động sau, hãy tạo 5 tiêu đề hấp dẫn, SEO-friendly (60-80 ký tự mỗi tiêu đề):

${content}

Trả về dưới dạng JSON array: ["Tiêu đề 1", "Tiêu đề 2", "Tiêu đề 3", "Tiêu đề 4", "Tiêu đề 5"]`;
        break;

      case 'generate_excerpt':
        prompt = `Hãy tóm tắt nội dung blog sau thành excerpt ngắn gọn, hấp dẫn (150-200 ký tự):

${content}

Excerpt phải:
- Thu hút người đọc
- Nêu bật vấn đề chính
- Kết thúc tự nhiên (không bị cắt ngang)

Chỉ trả về excerpt, không giải thích thêm.`;
        break;

      case 'generate_tags':
        prompt = `Phân tích nội dung blog về An toàn Lao động sau và đề xuất 5-8 tags phù hợp:

${content}

Tags phải:
- Liên quan chặt chẽ đến nội dung
- Ngắn gọn, dễ tìm kiếm
- Viết thường, không dấu (slug format)
- VD: an-toan-dien, pccc, luat-le

Trả về dưới dạng JSON array: ["tag1", "tag2", "tag3", ...]`;
        break;

      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    if (action === 'generate_title' || action === 'generate_tags') {
      try {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\[[\s\S]*?\]/);
        const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
        text = JSON.parse(jsonText);
      } catch (parseError) {
        console.warn('Failed to parse as JSON, returning raw text');
      }
    }

    console.log('Content improvement completed');
    return {
      success: true,
      data: text
    };

  } catch (error) {
    console.error('Error improving content:', error);
    throw new functions.https.HttpsError('internal', 'Failed to improve content: ' + error.message);
  }
});

/**
 * Escape HTML entities to prevent XSS in meta tags
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Known social media and search engine crawler user-agents
 */
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit', 'Facebot',
  'Twitterbot', 'TwitterBot',
  'LinkedInBot',
  'WhatsApp',
  'Slackbot', 'Slack-ImgProxy',
  'TelegramBot',
  'Googlebot', 'Google-InspectionTool',
  'bingbot', 'msnbot',
  'Zalobot',
  'viber',
  'Pinterest', 'PinterestBot',
  'Discordbot',
  'Applebot',
  'Yandex',
  'rogerbot',
  'SemrushBot',
  'AhrefsBot',
  'DotBot',
  'gptbot',
  'chatgpt-user',
  'claudebot',
  'anthropic-ai',
  'perplexitybot',
  'oai-searchbot',
  'meta-externalagent',
  'bytespider',
  'gemini',
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(bot => ua.includes(bot.toLowerCase()));
}

/**
 * Đặt thông tin cache cho các hàm phục vụ meta tag.
 *
 * LỖI ĐÃ GẶP THẬT: blogMetaTags và trainingMetaTags trả về nội dung KHÁC NHAU
 * cho bot và cho người dùng thường — bot nhận trang thẻ meta, người dùng nhận
 * trang ứng dụng. Nhưng phản hồi lại đặt `Cache-Control: public` mà KHÔNG khai
 * báo `Vary: User-Agent`.
 *
 * Hậu quả: CDN của Firebase Hosting coi mọi request tới cùng một địa chỉ là
 * như nhau và dùng chung một bản cache. Bot Google hay Facebook ghé trước là
 * bản-dành-cho-bot bị cache, rồi phục vụ cho người thật. Mà bản đó có
 * `<meta http-equiv="refresh">` trỏ về CHÍNH địa chỉ đang mở, nên người dùng
 * rơi vào vòng chuyển hướng lặp lại chính nó.
 *
 * Ảnh hưởng toàn bộ bài blog và 8 trang lĩnh vực huấn luyện.
 *
 * `Vary: User-Agent` bảo CDN tách bản cache theo từng loại trình duyệt. Cache
 * kém hiệu quả hơn một chút, nhưng đó là cái giá đúng cho việc trả nội dung
 * khác nhau theo User-Agent.
 */
function datThongTinCache(res, giaySong) {
  res.set('Cache-Control', `public, max-age=${giaySong}, s-maxage=${giaySong * 2}`);
  res.set('Vary', 'User-Agent');
}

/**
 * Fetch and serve the SPA's index.html for regular browsers
 */
async function serveSPAForBrowser(res) {
  try {
    const response = await fetch('https://antoan.web.app/index.html');
    const html = await response.text();
    res.set('Content-Type', 'text/html; charset=utf-8');
    // Bắt buộc: hàm này trả nội dung KHÁC NHAU tuỳ User-Agent, nên phải báo cho
    // CDN biết mà tách bản cache. Xem giải thích đầy đủ ở datThongTinCache().
    res.set('Vary', 'User-Agent');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(html);
  } catch (error) {
    console.error('Error fetching index.html:', error);
    res.redirect(302, 'https://antoan.web.app/');
  }
}

/**
 * SEO-friendly Blog Post Meta Tags for Social Media Crawlers (V1)
 */
exports.blogMetaTags = functions.https.onRequest(async (req, res) => {
  const urlPath = req.url || req.path;
  const userAgent = req.headers['user-agent'] || '';

  const pathMatch = urlPath.match(/\/blog\/([^/?#]+)/);
  const slugOrId = pathMatch ? pathMatch[1] : '';

  console.log('blogMetaTags called:', { urlPath, slugOrId, isCrawler: isCrawler(userAgent) });

  if (!isCrawler(userAgent)) {
    return serveSPAForBrowser(res);
  }

  if (!slugOrId || slugOrId === 'blog') {
    res.redirect(302, 'https://antoan.web.app/');
    return;
  }

  try {
    let postDoc = null;
    let postId = slugOrId;

    const slugQuery = db.collection('blogPosts').where('slug', '==', slugOrId).limit(1);
    const slugSnapshot = await slugQuery.get();

    if (!slugSnapshot.empty) {
      postDoc = slugSnapshot.docs[0];
      postId = postDoc.id;
    } else {
      const idDoc = await db.collection('blogPosts').doc(slugOrId).get();
      if (idDoc.exists) {
        postDoc = idDoc;
        postId = idDoc.id;
      }
    }

    if (!postDoc || !postDoc.exists) {
      console.log('Post not found:', slugOrId);
      res.redirect(302, 'https://antoan.web.app/blog');
      return;
    }

    const post = postDoc.data();
    const blogSlug = post.slug || postId;
    const url = `https://antoan.web.app/blog/${blogSlug}`;

    const title = escapeHtml(post.title);
    const excerpt = escapeHtml(post.excerpt);
    const siteName = 'SafetyConnect';
    const coverImage = post.coverImage || '';
    const authorName = escapeHtml(post.author?.name || 'SafetyConnect');
    const keywords = (post.tags || []).map(t => escapeHtml(t)).join(', ');
    const category = escapeHtml(post.category || '');
    const publishedDate = post.publishedAt?.toDate?.()?.toISOString() || post.createdAt?.toDate?.()?.toISOString() || '';
    const modifiedDate = post.updatedAt?.toDate?.()?.toISOString() || publishedDate;

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Primary Meta Tags -->
  <title>${title} | ${siteName}</title>
  <meta name="title" content="${title} | ${siteName}" />
  <meta name="description" content="${excerpt}" />
  <meta name="keywords" content="${keywords}" />
  <meta name="author" content="${authorName}" />
  <link rel="canonical" href="${url}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${excerpt}" />
  <meta property="og:image" content="${coverImage}" />
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:locale" content="vi_VN" />
  <meta property="article:published_time" content="${publishedDate}" />
  <meta property="article:modified_time" content="${modifiedDate}" />
  <meta property="article:author" content="${authorName}" />
  <meta property="article:section" content="${category}" />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="${url}" />
  <meta property="twitter:title" content="${title}" />
  <meta property="twitter:description" content="${excerpt}" />
  <meta property="twitter:image" content="${coverImage}" />
  
  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "description": "${excerpt}",
    "image": "${coverImage}",
    "datePublished": "${publishedDate}",
    "dateModified": "${modifiedDate}",
    "author": {
      "@type": "Person",
      "name": "${authorName}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "${siteName}",
      "logo": {
        "@type": "ImageObject",
        "url": "https://raw.githubusercontent.com/thanhlv87/pic/refs/heads/main/connected.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "${url}"
    },
    "keywords": "${keywords}",
    "articleSection": "${category}",
    "inLanguage": "vi-VN"
  }
  </script>
  
  <!-- Redirect to actual SPA page -->
  <meta http-equiv="refresh" content="0; url=${url}" />
  <script>window.location.href = "${url}";</script>
</head>
<body>
  <p>Redirecting to <a href="${url}">${title}</a>...</p>
</body>
</html>`;

    datThongTinCache(res, 600);
    res.send(html);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.redirect(302, 'https://antoan.web.app/blog');
  }
});

/**
 * Dynamic Sitemap Generator (V1)
 */
exports.dynamicSitemap = functions.https.onRequest(async (req, res) => {
  try {
    const BASE_URL = 'https://antoan.web.app';
    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
      { url: '/', changefreq: 'daily', priority: '1.0' },
      { url: '/blog', changefreq: 'daily', priority: '0.9' },
      { url: '/requests', changefreq: 'weekly', priority: '0.9' },
      { url: '/documents', changefreq: 'weekly', priority: '0.8' },
      { url: '/partners', changefreq: 'weekly', priority: '0.8' },
      { url: '/chat', changefreq: 'weekly', priority: '0.7' },
      { url: '/training/an-toan-dien', changefreq: 'monthly', priority: '0.8' },
      { url: '/training/an-toan-xay-dung', changefreq: 'monthly', priority: '0.8' },
      { url: '/training/an-toan-hoa-chat', changefreq: 'monthly', priority: '0.8' },
      { url: '/training/pccc', changefreq: 'monthly', priority: '0.8' },
      { url: '/training/an-toan-buc-xa', changefreq: 'monthly', priority: '0.8' },
      { url: '/training/quan-trac-moi-truong', changefreq: 'monthly', priority: '0.8' },
      { url: '/training/danh-gia-phan-loai-lao-dong', changefreq: 'monthly', priority: '0.8' },
      { url: '/training/so-cap-cuu', changefreq: 'monthly', priority: '0.8' },
    ];

    const blogSnapshot = await db.collection('blogPosts')
      .where('published', '==', true)
      .orderBy('publishedAt', 'desc')
      .get();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}${page.url}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    blogSnapshot.forEach(doc => {
      const post = doc.data();
      const blogSlug = post.slug || doc.id;
      const lastmod = post.updatedAt?.toDate() || post.publishedAt?.toDate() || post.createdAt?.toDate() || new Date();

      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/blog/${blogSlug}</loc>\n`;
      xml += `    <lastmod>${lastmod.toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.set('Content-Type', 'application/xml');
    datThongTinCache(res, 3600);
    res.send(xml);

    console.log(`Dynamic sitemap generated: ${staticPages.length} static + ${blogSnapshot.size} blog = ${staticPages.length + blogSnapshot.size} URLs`);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * SEO-friendly Training Landing Page Meta Tags for Search Engine and AI Crawlers
 */
exports.trainingMetaTags = functions.https.onRequest(async (req, res) => {
  const urlPath = req.url || req.path;
  const userAgent = req.headers['user-agent'] || '';

  const pathMatch = urlPath.match(/\/training\/([^/?#]+)/);
  const trainingType = pathMatch ? pathMatch[1] : '';

  console.log('trainingMetaTags called:', { urlPath, trainingType, isCrawler: isCrawler(userAgent) });

  if (!isCrawler(userAgent)) {
    return serveSPAForBrowser(res);
  }

  const trainingData = {
    'an-toan-dien': {
      title: 'Huấn Luyện An Toàn Điện Trực Tuyến & Online',
      metaDescription: 'Huấn luyện an toàn điện trực tuyến (online) phối hợp thực hành thực tế, cấp chứng chỉ nhanh theo Nghị định 44. Tiết kiệm thời gian, tối ưu chi phí cho doanh nghiệp.',
      keywords: 'huấn luyện an toàn điện trực tuyến, đào tạo an toàn điện online, chứng chỉ an toàn điện, an toàn lao động điện',
      certificate: 'Chứng chỉ An Toàn Điện theo Nghị định 44/2016/NĐ-CP',
      imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=400&fit=crop'
    },
    'an-toan-xay-dung': {
      title: 'Huấn Luyện An Toàn Xây Dựng Trực Tuyến & Online',
      metaDescription: 'Huấn luyện an toàn xây dựng trực tuyến, online kết hợp thực hành công trường cho công nhân và kỹ sư. Cấp chứng chỉ an toàn lao động xây dựng hợp pháp nhanh chóng.',
      keywords: 'huấn luyện an toàn xây dựng online, đào tạo an toàn xây dựng trực tuyến, chứng chỉ xây dựng, an toàn lao động xây dựng',
      certificate: 'Chứng chỉ An Toàn Xây Dựng theo Nghị định 44/2016/NĐ-CP',
      imageUrl: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&h=400&fit=crop'
    },
    'an-toan-hoa-chat': {
      title: 'Huấn Luyện An Toàn Hóa Chất Online & Trực Tiếp',
      metaDescription: 'Đào tạo và huấn luyện an toàn hóa chất trực tuyến cho doanh nghiệp. Học về MSDS, phân loại hóa chất, xử lý sự cố tràn đổ hóa chất. Cấp chứng chỉ hợp lệ.',
      keywords: 'huấn luyện an toàn hóa chất trực tuyến, đào tạo an toàn hóa chất online, chứng chỉ hóa chất, an toàn lao động hóa chất',
      certificate: 'Chứng chỉ An Toàn Hóa Chất theo quy định',
      imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=400&fit=crop'
    },
    'pccc': {
      title: 'Huấn Luyện Phòng Cháy Chữa Cháy (PCCC) Online & Trực Tiếp',
      metaDescription: 'Đào tạo và huấn luyện PCCC trực tuyến, online kết hợp diễn tập chữa cháy, cứu hộ cứu nạn. Cấp chứng chỉ PCCC hợp lệ theo Nghị định 136 nhanh chóng.',
      keywords: 'huấn luyện pccc trực tuyến, đào tạo pccc online, chứng chỉ pccc, an toàn cháy nổ, nghị định 136',
      certificate: 'Chứng chỉ PCCC theo Nghị định 136/2020/NĐ-CP',
      imageUrl: 'https://images.unsplash.com/photo-1587588354456-ae376af71a25?w=800&h=400&fit=crop'
    },
    'an-toan-buc-xa': {
      title: 'Huấn Luyện An Toàn Bức Xạ Trực Tuyến & Online',
      metaDescription: 'Đào tạo và huấn luyện an toàn bức xạ online/trực tiếp cho cán bộ, nhân viên y tế. Cấp chứng chỉ an toàn bức xạ đúng quy định pháp luật.',
      keywords: 'đào tạo an toàn bức xạ trực tuyến, huấn luyện an toàn bức xạ online, chứng chỉ an toàn bức xạ, phòng hộ bức xạ',
      certificate: 'Chứng chỉ An Toàn Bức Xạ theo Luật Năng lượng nguyên tử',
      imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=400&fit=crop'
    },
    'quan-trac-moi-truong': {
      title: 'Đào Tạo Quan Trắc Môi Trường',
      metaDescription: 'Đào tạo quan trắc môi trường nước, không khí, đất. Học lấy mẫu, phân tích môi trường. Cấp chứng chỉ quan trắc môi trường hợp lệ.',
      keywords: 'đào tạo quan trắc môi trường, lấy mẫu môi trường, phân tích môi trường, chứng chỉ quan trắc',
      certificate: 'Chứng chỉ Quan Trắc Môi Trường theo Luật Bảo vệ môi trường',
      imageUrl: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=800&h=400&fit=crop'
    },
    'danh-gia-phan-loai-lao-dong': {
      title: 'Đào Tạo Đánh Giá Phân Loại Lao Động',
      metaDescription: 'Đào tạo đánh giá phân loại lao động cho HR, quản lý nhân sự. Học về định mức lao động, đánh giá năng lực. Cấp chứng chỉ hợp lệ.',
      keywords: 'đánh giá lao động, phân loại lao động, định mức lao động, quản lý nhân sự',
      certificate: 'Chứng chỉ Đánh Giá Phân Loại Lao Động',
      imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop'
    },
    'so-cap-cuu': {
      title: 'Huấn Luyện Sơ Cấp Cứu Trực Tuyến & Online',
      metaDescription: 'Đào tạo và huấn luyện sơ cấp cứu trực tuyến (online) cho cán bộ, công nhân. Học lý thuyết nhanh, thực hành thực tế, cấp chứng chỉ sơ cấp cứu hợp lệ.',
      keywords: 'huấn luyện sơ cấp cứu trực tuyến, đào tạo sơ cấp cứu online, CPR, sơ cứu ban đầu, chứng chỉ sơ cấp cứu',
      certificate: 'Chứng chỉ Sơ Cấp Cứu (First Aid Certificate)',
      imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&h=400&fit=crop'
    }
  };

  const data = trainingData[trainingType];

  if (!data) {
    res.redirect(302, 'https://antoan.web.app/');
    return;
  }

  const url = `https://antoan.web.app/training/${trainingType}`;
  const title = escapeHtml(data.title);
  const excerpt = escapeHtml(data.metaDescription);
  const siteName = 'SafetyConnect';
  const coverImage = data.imageUrl;
  const keywords = escapeHtml(data.keywords);
  const certificate = escapeHtml(data.certificate);

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Primary Meta Tags -->
  <title>${title} | ${siteName}</title>
  <meta name="title" content="${title} | ${siteName}" />
  <meta name="description" content="${excerpt}" />
  <meta name="keywords" content="${keywords}" />
  <meta name="author" content="SafetyConnect" />
  <link rel="canonical" href="${url}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${excerpt}" />
  <meta property="og:image" content="${coverImage}" />
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:locale" content="vi_VN" />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="${url}" />
  <meta property="twitter:title" content="${title}" />
  <meta property="twitter:description" content="${excerpt}" />
  <meta property="twitter:image" content="${coverImage}" />
  
  <!-- JSON-LD Course Schema -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "${title}",
    "description": "${excerpt}",
    "provider": {
      "@type": "Organization",
      "name": "${siteName}",
      "sameAs": "https://antoan.web.app/"
    },
    "educationalCredentialAwarded": "${certificate}",
    "offers": {
      "@type": "Offer",
      "category": "Education",
      "price": "0",
      "priceCurrency": "VND",
      "description": "Đăng ký nhận báo giá huấn luyện miễn phí từ các đối tác"
    }
  }
  </script>
  
  <!-- Redirect to actual SPA page -->
  <meta http-equiv="refresh" content="0; url=${url}" />
  <script>window.location.href = "${url}";</script>
</head>
<body>
  <p>Redirecting to <a href="${url}">${title}</a>...</p>
</body>
</html>`;

  datThongTinCache(res, 3600);
  res.send(html);
});
