/**
 * Định dạng tin nhắn Telegram.
 *
 * Tách khỏi index.js để test được bằng vitest — index.js gọi initializeApp()
 * ngay khi nạp, nên không import thẳng vào test được.
 */

/**
 * Escape ký tự đặc biệt trước khi ghép vào tin nhắn gửi ở chế độ HTML.
 *
 * Telegram chỉ chấp nhận đúng 3 thực thể này. Escape thừa (&quot;, &#039;) sẽ
 * hiện ra thành chữ thô trong tin nhắn, nên KHÔNG dùng chung với escapeHtml()
 * dành cho thẻ meta HTML — yêu cầu của hai chỗ khác nhau.
 *
 * Không có bước này, tên công ty chứa dấu & (rất phổ biến: "Điện lực A & B")
 * làm Telegram trả lỗi 400 và thông báo yêu cầu mới KHÔNG BAO GIỜ được gửi —
 * mất khách mà không ai hay. Ngoài ra người lạ có thể nhét thẻ <a href> để
 * chèn link giả mạo vào tin nhắn của admin.
 */
function escapeTelegramHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const TRAINING_TYPE_MAP = {
  'an-toan-dien': '⚡ An toàn Điện',
  'an-toan-xay-dung': '🏗️ An toàn Xây dựng',
  'an-toan-hoa-chat': '🧪 An toàn Hóa chất',
  'pccc': '🚒 Phòng Cháy Chữa Cháy',
  'an-toan-buc-xa': '☢️ An toàn Bức xạ',
  'quan-trac-moi-truong': '🌿 Quan trắc Môi trường',
  'danh-gia-phan-loai-lao-dong': '📋 Đánh giá Phân loại Lao động',
  'so-cap-cuu': '🏥 Sơ Cấp Cứu',
};

/**
 * Chuyển ngày tạo về chuỗi giờ Việt Nam.
 * Nhận cả Firestore Timestamp, object có .seconds, hoặc Date thường.
 */
function formatCreatedAt(createdAt) {
  if (!createdAt) return 'N/A';
  if (typeof createdAt.toDate === 'function') {
    return createdAt.toDate().toLocaleString('vi-VN');
  }
  if (createdAt.seconds) {
    return new Date(createdAt.seconds * 1000).toLocaleString('vi-VN');
  }
  if (createdAt instanceof Date) {
    return createdAt.toLocaleString('vi-VN');
  }
  return 'N/A';
}

/**
 * Dựng nội dung tin nhắn báo yêu cầu đào tạo mới.
 * Mọi giá trị do người dùng nhập đều đi qua escapeTelegramHtml.
 */
function formatTrainingRequestMessage(data) {
  const {
    trainingType,
    companyName,
    clientName,
    email,
    phone,
    location,
    numberOfTrainees,
    expectedStartDate,
    additionalInfo,
    createdAt,
  } = data || {};

  const trainingName = TRAINING_TYPE_MAP[trainingType] || trainingType || 'Không xác định';
  const date = formatCreatedAt(createdAt);
  const e = escapeTelegramHtml;

  return `
🔔 <b>YÊU CẦU ĐÀO TẠO MỚI</b>

${e(trainingName)}

👤 <b>Người liên hệ:</b> ${e(clientName) || 'Chưa cập nhật'}
🏢 <b>Công ty:</b> ${e(companyName) || 'Chưa cập nhật'}
📧 <b>Email:</b> ${e(email) || 'Chưa cập nhật'}
📱 <b>Điện thoại:</b> ${e(phone) || 'Chưa cập nhật'}
📍 <b>Địa điểm:</b> ${e(location) || 'Chưa cập nhật'}
👥 <b>Số học viên:</b> ${e(numberOfTrainees) || 'Chưa cập nhật'} người
📅 <b>Dự kiến bắt đầu:</b> ${e(expectedStartDate) || 'Chưa cập nhật'}
${additionalInfo ? `\n💬 <b>Ghi chú:</b> ${e(additionalInfo)}` : ''}

⏰ <b>Thời gian:</b> ${e(date)}

🔗 <a href="https://antoan.web.app/admin">Xem chi tiết</a>
  `.trim();
}

module.exports = {
  escapeTelegramHtml,
  formatTrainingRequestMessage,
  TRAINING_TYPE_MAP,
};
