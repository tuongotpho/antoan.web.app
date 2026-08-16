import { describe, it, expect } from 'vitest';
// @ts-expect-error — file CommonJS phía Cloud Functions, không có khai báo kiểu
import { escapeTelegramHtml, formatTrainingRequestMessage } from '../functions/telegramFormat.js';

/**
 * Tin nhắn Telegram được gửi với parse_mode: 'HTML'. Nếu dữ liệu khách nhập
 * lọt thẳng vào đó, Telegram trả lỗi 400 và thông báo yêu cầu mới KHÔNG được
 * gửi — mất khách mà không ai hay biết.
 */
describe('escapeTelegramHtml', () => {
  it('đổi dấu & — trường hợp làm mất thông báo trong thực tế', () => {
    // Tên doanh nghiệp Việt Nam rất hay có dấu &
    expect(escapeTelegramHtml('Điện lực A & B')).toBe('Điện lực A &amp; B');
  });

  it('đổi dấu < và >', () => {
    expect(escapeTelegramHtml('Cơ khí <Sao Việt>')).toBe('Cơ khí &lt;Sao Việt&gt;');
  });

  it('vô hiệu hoá thẻ liên kết giả mạo', () => {
    const doc = '<a href="https://trang-gia-mao.example">Bấm vào đây</a>';
    const ketQua = escapeTelegramHtml(doc);
    expect(ketQua).not.toContain('<a href');
    expect(ketQua).toContain('&lt;a href=');
  });

  it('KHÔNG escape nháy đơn và nháy kép (Telegram không hiểu &quot; &#039;)', () => {
    expect(escapeTelegramHtml(`Công ty "Sao Mai" của Trần's`)).toBe(
      `Công ty "Sao Mai" của Trần's`
    );
  });

  it('trả về chuỗi rỗng khi thiếu dữ liệu', () => {
    expect(escapeTelegramHtml(null)).toBe('');
    expect(escapeTelegramHtml(undefined)).toBe('');
    expect(escapeTelegramHtml('')).toBe('');
  });

  it('giữ nguyên tiếng Việt có dấu', () => {
    expect(escapeTelegramHtml('Huấn luyện an toàn điện — Nhóm 3')).toBe(
      'Huấn luyện an toàn điện — Nhóm 3'
    );
  });

  it('chuyển số thành chuỗi, không vỡ', () => {
    expect(escapeTelegramHtml(45)).toBe('45');
  });
});

describe('formatTrainingRequestMessage', () => {
  const duLieuMau = {
    trainingType: 'an-toan-dien',
    companyName: 'Điện lực A & B',
    clientName: 'Nguyễn Văn An',
    email: 'an@dienluc.vn',
    phone: '0982722036',
    location: 'Hà Nội',
    numberOfTrainees: 30,
    expectedStartDate: '01/09/2026',
    additionalInfo: 'Cần giảng viên có chứng chỉ <nhóm 3>',
    createdAt: new Date('2026-08-16T10:00:00Z'),
  };

  it('không để lọt dấu & thô ra ngoài các thẻ hợp lệ', () => {
    const tin = formatTrainingRequestMessage(duLieuMau);
    // Bỏ hết thực thể đã escape rồi mới soi: không được còn & hay < > nào lạ
    const conLai = tin.replace(/&(amp|lt|gt);/g, '');
    const theHopLe = conLai.replace(/<\/?(b|a)(\s[^>]*)?>/g, '');
    expect(theHopLe).not.toMatch(/[<>&]/);
  });

  it('hiển thị tên công ty có dấu & dưới dạng an toàn', () => {
    const tin = formatTrainingRequestMessage(duLieuMau);
    expect(tin).toContain('Điện lực A &amp; B');
    expect(tin).not.toContain('Điện lực A & B');
  });

  it('vô hiệu hoá thẻ trong phần ghi chú', () => {
    const tin = formatTrainingRequestMessage(duLieuMau);
    expect(tin).toContain('&lt;nhóm 3&gt;');
  });

  it('giữ nguyên các thẻ định dạng của chính tin nhắn', () => {
    const tin = formatTrainingRequestMessage(duLieuMau);
    expect(tin).toContain('<b>YÊU CẦU ĐÀO TẠO MỚI</b>');
    expect(tin).toContain('<a href="https://antoan.web.app/admin">');
  });

  it('dịch mã loại hình sang tên tiếng Việt', () => {
    const tin = formatTrainingRequestMessage(duLieuMau);
    expect(tin).toContain('An toàn Điện');
  });

  it('điền "Chưa cập nhật" cho ô trống thay vì để trống', () => {
    const tin = formatTrainingRequestMessage({ trainingType: 'pccc' });
    expect(tin).toContain('Chưa cập nhật');
    expect(tin).toContain('Phòng Cháy Chữa Cháy');
  });

  it('không vỡ khi createdAt là Firestore Timestamp', () => {
    const tin = formatTrainingRequestMessage({
      ...duLieuMau,
      createdAt: { seconds: 1755338400, nanoseconds: 0 },
    });
    expect(tin).toContain('Thời gian:');
    expect(tin).not.toContain('N/A');
  });

  it('không vỡ khi không có dữ liệu nào', () => {
    expect(() => formatTrainingRequestMessage({})).not.toThrow();
    expect(() => formatTrainingRequestMessage(undefined)).not.toThrow();
  });
});
