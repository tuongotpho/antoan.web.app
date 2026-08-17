import { describe, it, expect } from 'vitest';
// File CommonJS phía Cloud Functions, không có khai báo kiểu.
import { escapeTelegramHtml, formatTrainingRequestMessage } from '../functions/telegramFormat.js';

/**
 * Tin nhắn Telegram được gửi với parse_mode: 'HTML'. Nếu dữ liệu khách nhập
 * lọt thẳng vào đó, Telegram trả lỗi 400 và thông báo yêu cầu mới KHÔNG được
 * gửi — mất khách mà không ai hay biết.
 */
describe('escapeTelegramHtml', () => {
  it('đổi dấu & — trường hợp làm mất thông báo trong thực tế', () => {
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
  /**
   * Dữ liệu này phải khớp ĐÚNG những gì TrainingRequestForm.tsx lưu xuống
   * Firestore. Bản trước đọc nhầm sang tên trường của một phiên bản form cũ,
   * nên tin nhắn gửi đi hầu hết là "Chưa cập nhật" dù khách điền đầy đủ.
   */
  const nhuFormThatLuu = {
    clientName: 'Nguyễn Văn An',
    clientEmail: 'an@dienluc.vn',
    clientPhone: '0982722036',
    location: 'Hà Nội',
    description: 'Cần giảng viên có chứng chỉ, đào tạo ngoài giờ hành chính',
    trainingDuration: '2 ngày',
    preferredTime: 'T9/2026',
    trainingDetails: [
      { type: 'an-toan-dien', group: 'Nhóm 3 (NĐ 44)', participants: 30 },
      { type: 'so-cap-cuu', group: 'Không áp dụng', participants: 12 },
    ],
    urgent: false,
    createdAt: new Date('2026-08-16T10:00:00Z'),
  };

  it('hiện đủ thông tin liên hệ khách điền — không còn "Chưa cập nhật"', () => {
    const tin = formatTrainingRequestMessage(nhuFormThatLuu);
    expect(tin).toContain('Nguyễn Văn An');
    expect(tin).toContain('an@dienluc.vn');
    expect(tin).toContain('0982722036');
    expect(tin).toContain('Hà Nội');
    expect(tin).not.toContain('Chưa cập nhật');
  });

  it('liệt kê từng nội dung huấn luyện kèm số học viên', () => {
    const tin = formatTrainingRequestMessage(nhuFormThatLuu);
    expect(tin).toContain('An toàn Điện');
    expect(tin).toContain('Sơ Cấp Cứu');
    expect(tin).toContain('30');
    expect(tin).toContain('12');
  });

  it('cộng đúng tổng số học viên của mọi nội dung', () => {
    const tin = formatTrainingRequestMessage(nhuFormThatLuu);
    expect(tin).toContain('Tổng: 42 học viên');
  });

  it('bỏ nhãn nhóm khi khách chọn "Không áp dụng"', () => {
    const tin = formatTrainingRequestMessage(nhuFormThatLuu);
    expect(tin).not.toContain('Không áp dụng');
    expect(tin).toContain('Nhóm 3 (NĐ 44)');
  });

  it('hiện thời lượng và thời gian mong muốn', () => {
    const tin = formatTrainingRequestMessage(nhuFormThatLuu);
    expect(tin).toContain('2 ngày');
    expect(tin).toContain('T9/2026');
  });

  it('hiện mô tả chi tiết khách nhập', () => {
    const tin = formatTrainingRequestMessage(nhuFormThatLuu);
    expect(tin).toContain('Cần giảng viên có chứng chỉ');
  });

  it('đánh dấu rõ khi là yêu cầu khẩn cấp', () => {
    const thuong = formatTrainingRequestMessage(nhuFormThatLuu);
    const khan = formatTrainingRequestMessage({ ...nhuFormThatLuu, urgent: true });
    expect(thuong).toContain('YÊU CẦU ĐÀO TẠO MỚI');
    expect(thuong).not.toContain('KHẨN CẤP');
    expect(khan).toContain('KHẨN CẤP');
  });

  it('KHÔNG còn chèn liên kết vào tin nhắn', () => {
    const tin = formatTrainingRequestMessage(nhuFormThatLuu);
    expect(tin).not.toContain('<a href');
    expect(tin).not.toContain('antoan.web.app');
  });

  it('hiển thị tên công ty có dấu & dưới dạng an toàn', () => {
    const tin = formatTrainingRequestMessage({
      ...nhuFormThatLuu,
      clientName: 'Điện lực A & B',
    });
    expect(tin).toContain('Điện lực A &amp; B');
  });

  it('không để lọt dấu & hay thẻ lạ ra ngoài các thẻ hợp lệ', () => {
    const tin = formatTrainingRequestMessage({
      ...nhuFormThatLuu,
      description: 'Xem <a href="http://xau.example">tại đây</a> & liên hệ',
    });
    const conLai = tin.replace(/&(amp|lt|gt);/g, '');
    const theHopLe = conLai.replace(/<\/?b>/g, '');
    expect(theHopLe).not.toMatch(/[<>&]/);
  });

  it('dùng giờ Việt Nam chứ không phải giờ máy chủ', () => {
    // Cloud Functions chạy giờ UTC. 10:00 UTC là 17:00 cùng ngày ở Việt Nam.
    const tin = formatTrainingRequestMessage(nhuFormThatLuu);
    expect(tin).toContain('17:00');
  });

  it('không vỡ khi thiếu dữ liệu', () => {
    expect(() => formatTrainingRequestMessage({})).not.toThrow();
    expect(() => formatTrainingRequestMessage(undefined)).not.toThrow();
    expect(formatTrainingRequestMessage({})).toContain('Chưa cập nhật');
  });

  it('không vỡ khi createdAt là Firestore Timestamp', () => {
    const tin = formatTrainingRequestMessage({
      ...nhuFormThatLuu,
      createdAt: { seconds: 1755338400, nanoseconds: 0 },
    });
    expect(tin).not.toContain('N/A');
  });
});
