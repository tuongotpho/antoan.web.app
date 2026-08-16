import { describe, it, expect } from 'vitest';
import { escapeHtml, escapeHtmlGiuXuongDong } from '../utils/htmlEscape';
import { generateQuoteNotificationEmail } from '../utils/emailTemplates';

describe('escapeHtml', () => {
  it('đổi dấu & — tên doanh nghiệp Việt Nam rất hay có', () => {
    expect(escapeHtml('Điện lực A & B')).toBe('Điện lực A &amp; B');
  });

  it('vô hiệu hoá thẻ HTML', () => {
    expect(escapeHtml('<script>alert(1)</script>')).not.toContain('<script>');
  });

  it('escape cả nháy kép và nháy đơn — cần cho giá trị nằm trong thuộc tính', () => {
    // Chỗ href="mailto:..." mà không escape nháy kép thì thoát được ra ngoài
    // thuộc tính để gắn thêm mã vào thẻ.
    expect(escapeHtml('x" onmouseover="xau')).toBe('x&quot; onmouseover=&quot;xau');
    expect(escapeHtml("x' onload='xau")).toBe('x&#39; onload=&#39;xau');
  });

  it('giữ nguyên tiếng Việt có dấu', () => {
    expect(escapeHtml('Huấn luyện an toàn điện — Nhóm 3')).toBe(
      'Huấn luyện an toàn điện — Nhóm 3'
    );
  });

  it('không vỡ với giá trị trống', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(0)).toBe('0');
  });
});

describe('escapeHtmlGiuXuongDong', () => {
  it('giữ cách xuống dòng của người dùng', () => {
    expect(escapeHtmlGiuXuongDong('dòng 1\ndòng 2')).toBe('dòng 1<br>dòng 2');
    expect(escapeHtmlGiuXuongDong('dòng 1\r\ndòng 2')).toBe('dòng 1<br>dòng 2');
  });

  it('vẫn escape thẻ chứ không thả lỏng', () => {
    expect(escapeHtmlGiuXuongDong('<b>đậm</b>\nsau')).toBe('&lt;b&gt;đậm&lt;/b&gt;<br>sau');
  });
});

describe('generateQuoteNotificationEmail — email gửi thẳng tới khách hàng', () => {
  const duLieuGoc = {
    clientName: 'Nguyễn Văn An',
    requestId: 'yc123',
    partnerName: 'Công ty CP An toàn Miền Bắc',
    partnerEmail: 'lienhe@antoan.vn',
    price: 15000000,
    timeline: '3 ngày',
    notes: 'Bao gồm tài liệu và chứng chỉ',
    trainingDetails: [{ type: 'An toàn điện', group: 'Nhóm 3', participants: 30 }],
  };

  it('không cho chèn link giả mạo qua ô ghi chú báo giá', () => {
    // Kịch bản thật: một đối tác gửi báo giá kèm ghi chú chứa thẻ liên kết.
    // Email tới khách trông y như thư chính thức của nền tảng.
    const html = generateQuoteNotificationEmail({
      ...duLieuGoc,
      notes: 'Xem thêm <a href="https://trang-lua-dao.example">tại đây</a>',
    });
    expect(html).not.toContain('<a href="https://trang-lua-dao.example"');
    expect(html).toContain('&lt;a href=');
  });

  it('không cho chèn thẻ script qua tên đối tác', () => {
    const html = generateQuoteNotificationEmail({
      ...duLieuGoc,
      partnerName: '<script>document.location="http://xau.example"</script>',
    });
    expect(html).not.toContain('<script>document.location');
  });

  it('không cho thoát ra khỏi thuộc tính href qua email đối tác', () => {
    const html = generateQuoteNotificationEmail({
      ...duLieuGoc,
      partnerEmail: 'a@b.vn" style="display:none',
    });
    expect(html).not.toContain('a@b.vn" style="display:none');
  });

  it('hiển thị đúng tên công ty có dấu &', () => {
    const html = generateQuoteNotificationEmail({
      ...duLieuGoc,
      partnerName: 'Điện lực A & B',
    });
    expect(html).toContain('Điện lực A &amp; B');
  });

  it('vẫn giữ nội dung thật và định dạng của chính email', () => {
    const html = generateQuoteNotificationEmail(duLieuGoc);
    expect(html).toContain('Nguyễn Văn An');
    expect(html).toContain('Công ty CP An toàn Miền Bắc');
    expect(html).toContain('An toàn điện');
    expect(html).toContain('<div class="email-container">');
  });

  it('không còn liên kết trỏ sai tên miền', () => {
    const html = generateQuoteNotificationEmail(duLieuGoc);
    expect(html).not.toContain('atld.web.app');
    expect(html).toContain('antoan.web.app');
  });
});
