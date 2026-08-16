import { escapeHtml, escapeHtmlGiuXuongDong } from './htmlEscape';

interface TrainingDetail {
  type: string;
  group: string;
  participants: number;
}

interface ClientInfo {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  location: string;
  description: string;
  trainingDuration: string;
  preferredTime: string;
}

/**
 * Generate beautiful HTML email template for partner notification
 */
export const generatePartnerNotificationEmail = (
  trainingDetails: TrainingDetail[],
  clientInfo: ClientInfo,
  isUrgent: boolean = false
): string => {
  const trainingTypesText = trainingDetails.map((d) => d.type).join(', ');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yêu cầu đào tạo mới</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .urgent-badge {
      display: inline-block;
      background-color: #ef4444;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 12px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
    .content {
      padding: 40px 30px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .training-item {
      background-color: #f8fafc;
      border-left: 4px solid #3b82f6;
      padding: 16px 20px;
      margin-bottom: 12px;
      border-radius: 4px;
    }
    .training-item strong {
      color: #1e3a8a;
      font-size: 16px;
      display: block;
      margin-bottom: 8px;
    }
    .training-item .meta {
      color: #64748b;
      font-size: 14px;
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .training-item .meta span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .info-item {
      display: flex;
      padding: 12px;
      background-color: #fafafa;
      border-radius: 6px;
    }
    .info-item .label {
      font-weight: 600;
      color: #475569;
      min-width: 120px;
    }
    .info-item .value {
      color: #1e293b;
      flex: 1;
    }
    .cta-button {
      display: block;
      width: 100%;
      max-width: 300px;
      margin: 32px auto;
      padding: 16px 32px;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: #ffffff;
      text-align: center;
      text-decoration: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    }
    .footer {
      background-color: #f8fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 8px 0;
      color: #64748b;
      font-size: 14px;
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e5e7eb, transparent);
      margin: 24px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 24px;
      }
      .content {
        padding: 30px 20px;
      }
      .info-item {
        flex-direction: column;
        gap: 4px;
      }
      .info-item .label {
        min-width: auto;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <h1>🎯 Yêu Cầu Đào Tạo Mới</h1>
      <p>Cơ hội kinh doanh phù hợp với năng lực của bạn</p>
      ${isUrgent ? '<div class="urgent-badge">⚡ KHẨN CẤP - ƯU TIÊN CAO</div>' : ''}
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Training Details Section -->
      <div class="section">
        <div class="section-title">📚 Nội dung đào tạo yêu cầu</div>
        ${trainingDetails
          .map(
            (detail) => `
          <div class="training-item">
            <strong>${escapeHtml(detail.type)}</strong>
            <div class="meta">
              <span>👥 Nhóm: ${escapeHtml(detail.group)}</span>
              <span>🎓 Số lượng: ${escapeHtml(detail.participants)} học viên</span>
            </div>
          </div>
        `
          )
          .join('')}
      </div>

      <div class="divider"></div>

      <!-- Client Information Section -->
      <div class="section">
        <div class="section-title">👤 Thông tin khách hàng</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="label">Tên liên hệ:</div>
            <div class="value">${escapeHtml(clientInfo.clientName)}</div>
          </div>
          <div class="info-item">
            <div class="label">Email:</div>
            <div class="value"><a href="mailto:${escapeHtml(clientInfo.clientEmail)}" style="color: #3b82f6; text-decoration: none;">${escapeHtml(clientInfo.clientEmail)}</a></div>
          </div>
          <div class="info-item">
            <div class="label">Điện thoại:</div>
            <div class="value"><a href="tel:${escapeHtml(clientInfo.clientPhone)}" style="color: #3b82f6; text-decoration: none;">${escapeHtml(clientInfo.clientPhone)}</a></div>
          </div>
          <div class="info-item">
            <div class="label">Địa điểm:</div>
            <div class="value">📍 ${escapeHtml(clientInfo.location)}</div>
          </div>
          <div class="info-item">
            <div class="label">Thời lượng:</div>
            <div class="value">⏱️ ${escapeHtml(clientInfo.trainingDuration)}</div>
          </div>
          <div class="info-item">
            <div class="label">Thời gian mong muốn:</div>
            <div class="value">📅 ${escapeHtml(clientInfo.preferredTime)}</div>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Description Section -->
      <div class="section">
        <div class="section-title">📝 Mô tả chi tiết</div>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; line-height: 1.6; color: #334155;">
          ${escapeHtmlGiuXuongDong(clientInfo.description)}
        </div>
      </div>

      <!-- CTA Button -->
      <!-- Trước đây trỏ https://atld.web.app/login: sai tên miền, và /login là
           đường dẫn không có trong router (đăng nhập là hộp thoại ngay tại
           trang danh sách yêu cầu). Đối tác bấm vào chỉ tới trang trống. -->
      <a href="https://antoan.web.app/requests" class="cta-button">
        🔐 Đăng nhập để xem chi tiết & Gửi báo giá
      </a>

      <!-- Info Box -->
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-top: 24px;">
        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
          💡 <strong>Gợi ý:</strong> Hãy phản hồi nhanh để tăng cơ hội được chọn. Khách hàng thường ưu tiên những đơn vị đào tạo phản hồi sớm và chi tiết nhất.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Hệ thống kết nối đào tạo ATLD</strong></p>
      <p>Email này được gửi tự động từ hệ thống</p>
      <!-- /settings cũng là đường dẫn không tồn tại. Tuỳ chọn nhận email nằm
           trong hồ sơ đối tác, sửa ở trang danh sách yêu cầu sau khi đăng nhập. -->
      <p>Nếu bạn không muốn nhận email thông báo, vui lòng cập nhật trong <a href="https://antoan.web.app/requests">hồ sơ đối tác</a></p>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #94a3b8;">
          © ${new Date().getFullYear()} ATLD. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};

interface QuoteNotificationData {
  clientName: string;
  requestId: string;
  partnerName: string;
  partnerEmail: string;
  price: number;
  timeline: string;
  notes: string;
  trainingDetails: TrainingDetail[];
}

/**
 * Generate beautiful HTML email template for quote notification to client
 */
export const generateQuoteNotificationEmail = (data: QuoteNotificationData): string => {
  const formattedPrice = data.price.toLocaleString('vi-VN');
  const trainingTypesText = data.trainingDetails.map((d) => d.type).join(', ');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bạn có báo giá mới</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .new-badge {
      display: inline-block;
      background-color: #f59e0b;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 12px;
      animation: bounce 1s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    .content {
      padding: 40px 30px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #16a34a;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .quote-card {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 2px solid #22c55e;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .price-display {
      text-align: center;
      margin: 20px 0;
    }
    .price-amount {
      font-size: 36px;
      font-weight: 800;
      color: #16a34a;
      display: block;
    }
    .price-label {
      font-size: 14px;
      color: #15803d;
      display: block;
      margin-top: 8px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .info-item {
      display: flex;
      padding: 12px;
      background-color: #fafafa;
      border-radius: 6px;
    }
    .info-item .label {
      font-weight: 600;
      color: #475569;
      min-width: 140px;
    }
    .info-item .value {
      color: #1e293b;
      flex: 1;
    }
    .notes-box {
      background-color: #f8fafc;
      padding: 16px;
      border-radius: 6px;
      border-left: 4px solid #22c55e;
      line-height: 1.6;
      color: #334155;
      white-space: pre-wrap;
    }
    .training-item {
      background-color: #f8fafc;
      border-left: 4px solid #22c55e;
      padding: 12px 16px;
      margin-bottom: 10px;
      border-radius: 4px;
      font-size: 14px;
    }
    .cta-button {
      display: block;
      width: 100%;
      max-width: 320px;
      margin: 32px auto;
      padding: 16px 32px;
      background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
      color: #ffffff;
      text-align: center;
      text-decoration: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
    }
    .footer {
      background-color: #f8fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 8px 0;
      color: #64748b;
      font-size: 14px;
    }
    .footer a {
      color: #16a34a;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e5e7eb, transparent);
      margin: 24px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 24px;
      }
      .content {
        padding: 30px 20px;
      }
      .price-amount {
        font-size: 28px;
      }
      .info-item {
        flex-direction: column;
        gap: 4px;
      }
      .info-item .label {
        min-width: auto;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <h1>🎉 Bạn Có Báo Giá Mới!</h1>
      <p>Một đơn vị đào tạo đã quan tâm đến yêu cầu của bạn</p>
      <div class="new-badge">✨ MỚI</div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Lời chào. clientName vốn đã được truyền vào hàm này nhưng không dùng
           ở đâu cả, nên email báo giá gửi tới khách mà không xưng tên họ. -->
      <p style="font-size: 16px; color: #334155; margin: 0 0 20px;">
        Kính gửi <strong>${escapeHtml(data.clientName)}</strong>,
      </p>

      <!-- Quote Card -->
      <div class="quote-card">
        <div style="text-align: center; margin-bottom: 16px;">
          <h2 style="margin: 0; color: #16a34a; font-size: 20px;">💼 Báo Giá Chi Tiết</h2>
        </div>

        <div class="price-display">
          <span class="price-amount">${formattedPrice} VND</span>
          <span class="price-label">Giá báo cho yêu cầu của bạn</span>
        </div>

        <div style="text-align: center; padding: 16px 0; border-top: 1px solid #86efac; border-bottom: 1px solid #86efac; margin: 16px 0;">
          <div style="font-size: 14px; color: #15803d; margin-bottom: 4px;">⏱️ Thời gian thực hiện</div>
          <div style="font-size: 18px; font-weight: 700; color: #16a34a;">${escapeHtml(data.timeline)}</div>
        </div>
      </div>

      <!-- Partner Info Section -->
      <div class="section">
        <div class="section-title">👥 Thông tin đơn vị đào tạo</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="label">Tên đơn vị:</div>
            <div class="value">${escapeHtml(data.partnerName)}</div>
          </div>
          <div class="info-item">
            <div class="label">Email liên hệ:</div>
            <div class="value"><a href="mailto:${escapeHtml(data.partnerEmail)}" style="color: #16a34a; text-decoration: none;">${escapeHtml(data.partnerEmail)}</a></div>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Quote Details Section -->
      <div class="section">
        <div class="section-title">📝 Chi tiết báo giá</div>
        <div class="notes-box">
${escapeHtmlGiuXuongDong(data.notes)}
        </div>
      </div>

      <div class="divider"></div>

      <!-- Request Summary Section -->
      <div class="section">
        <div class="section-title">📚 Yêu cầu đào tạo của bạn</div>
        ${data.trainingDetails
          .map(
            (detail) => `
          <div class="training-item">
            <strong>${escapeHtml(detail.type)}</strong> - ${escapeHtml(detail.participants)} học viên (${escapeHtml(detail.group)})
          </div>
        `
          )
          .join('')}
      </div>

      <!-- CTA Button -->
      <a href="mailto:${escapeHtml(data.partnerEmail)}" class="cta-button">
        📧 Liên hệ đơn vị đào tạo ngay
      </a>

      <!-- Info Box -->
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-top: 24px;">
        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
          💡 <strong>Lưu ý:</strong> Bạn có thể nhận nhiều báo giá từ các đơn vị đào tạo khác nhau. Hãy so sánh kỹ về giá cả, chất lượng và thời gian để chọn đơn vị phù hợp nhất với nhu cầu của mình.
        </p>
      </div>

      <!-- Action Items -->
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin-top: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #16a34a; font-size: 16px;">✅ Bước tiếp theo</h3>
        <ol style="margin: 0; padding-left: 20px; color: #15803d; font-size: 14px; line-height: 1.8;">
          <li>Xem xét kỹ báo giá và so sánh với các đơn vị khác (nếu có)</li>
          <li>Liên hệ trực tiếp với đơn vị đào tạo qua email hoặc điện thoại</li>
          <li>Trao đổi thêm về chương trình, giảng viên, chứng chỉ</li>
          <li>Thương lượng giá cả và ký hợp đồng</li>
        </ol>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>SafetyConnect - Nền tảng kết nối đào tạo ATLD</strong></p>
      <p>Email này được gửi tự động từ hệ thống</p>
      <p>Mọi thắc mắc vui lòng truy cập <a href="https://antoan.web.app">antoan.web.app</a></p>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #94a3b8;">
          © ${new Date().getFullYear()} SafetyConnect. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};
