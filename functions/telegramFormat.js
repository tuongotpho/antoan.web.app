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
  let d = null;
  if (!createdAt) return 'N/A';
  if (typeof createdAt.toDate === 'function') d = createdAt.toDate();
  else if (createdAt.seconds) d = new Date(createdAt.seconds * 1000);
  else if (createdAt instanceof Date) d = createdAt;
  if (!d) return 'N/A';

  // Ép múi giờ Việt Nam: Cloud Functions chạy giờ UTC nên nếu để mặc định thì
  // yêu cầu gửi lúc tối ở Việt Nam sẽ hiện sang ngày hôm trước.
  return d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

/**
 * Gộp danh sách nội dung huấn luyện thành các dòng dễ đọc,
 * kèm tổng số học viên.
 */
function formatTrainingDetails(trainingDetails) {
  if (!Array.isArray(trainingDetails) || trainingDetails.length === 0) {
    return { dong: '', tongHocVien: 0 };
  }

  const e = escapeTelegramHtml;
  let tong = 0;
  const dong = trainingDetails
    .map((ct) => {
      const soLuong = Number(ct?.participants) || 0;
      tong += soLuong;
      const ten = TRAINING_TYPE_MAP[ct?.type] || ct?.type || 'Không xác định';
      const nhom = ct?.group && ct.group !== 'Không áp dụng' ? ` · ${e(ct.group)}` : '';
      return `   • ${e(ten)}${nhom} — <b>${soLuong}</b> học viên`;
    })
    .join('\n');

  return { dong, tongHocVien: tong };
}

/**
 * Dựng nội dung tin nhắn báo yêu cầu đào tạo mới.
 *
 * QUAN TRỌNG — tên trường phải khớp với TrainingRequestForm.tsx:
 *   clientName · clientEmail · clientPhone · location · description
 *   trainingDuration · preferredTime · trainingDetails[] · urgent
 *
 * Bản trước đọc nhầm sang tên của một phiên bản form cũ (email, phone,
 * additionalInfo, expectedStartDate, numberOfTrainees, trainingType,
 * companyName) — chỉ 3 trên 10 trường là khớp, nên tin nhắn gửi đi hầu hết
 * là "Chưa cập nhật" dù khách đã điền đầy đủ.
 *
 * Mọi giá trị do người dùng nhập đều đi qua escapeTelegramHtml.
 */
function formatTrainingRequestMessage(data) {
  const {
    clientName,
    clientEmail,
    clientPhone,
    location,
    description,
    trainingDuration,
    preferredTime,
    trainingDetails,
    urgent,
    createdAt,
  } = data || {};

  const e = escapeTelegramHtml;
  const { dong: dongNoiDung, tongHocVien } = formatTrainingDetails(trainingDetails);

  const phan = [];

  phan.push(urgent ? '🔥 <b>YÊU CẦU ĐÀO TẠO MỚI — KHẨN CẤP</b>' : '🔔 <b>YÊU CẦU ĐÀO TẠO MỚI</b>');
  phan.push('');

  if (dongNoiDung) {
    phan.push('📚 <b>Nội dung huấn luyện</b>');
    phan.push(dongNoiDung);
    if (tongHocVien > 0) phan.push(`   <b>Tổng: ${tongHocVien} học viên</b>`);
    phan.push('');
  }

  phan.push('👤 <b>Người liên hệ:</b> ' + (e(clientName) || 'Chưa cập nhật'));
  phan.push('📧 <b>Email:</b> ' + (e(clientEmail) || 'Chưa cập nhật'));
  phan.push('📱 <b>Điện thoại:</b> ' + (e(clientPhone) || 'Chưa cập nhật'));
  phan.push('📍 <b>Địa điểm:</b> ' + (e(location) || 'Chưa cập nhật'));

  if (trainingDuration) phan.push('⏱️ <b>Thời lượng:</b> ' + e(trainingDuration));
  if (preferredTime) phan.push('📅 <b>Thời gian mong muốn:</b> ' + e(preferredTime));

  if (description) {
    phan.push('');
    phan.push('💬 <b>Mô tả chi tiết:</b>');
    phan.push(e(description));
  }

  phan.push('');
  phan.push('⏰ ' + e(formatCreatedAt(createdAt)));

  return phan.join('\n').trim();
}

module.exports = {
  escapeTelegramHtml,
  formatTrainingRequestMessage,
  formatTrainingDetails,
  TRAINING_TYPE_MAP,
};
