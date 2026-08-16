import { describe, it, expect } from 'vitest';
import { layTenHienThiDoiTac, khachDongYNhanEmail } from '../utils/quoteHelpers';

describe('layTenHienThiDoiTac', () => {
  it('ưu tiên tên doanh nghiệp — không phải mã số thuế', () => {
    // Đây chính là lỗi cũ: khách nhận email thấy đơn vị báo giá tên là
    // "0101234567" thay vì tên công ty.
    expect(
      layTenHienThiDoiTac(
        { businessName: 'Công ty CP An toàn Miền Bắc', taxId: '0101234567' },
        'lienhe@antoanmienbac.vn'
      )
    ).toBe('Công ty CP An toàn Miền Bắc');
  });

  it('lùi về mã số thuế khi chưa điền tên doanh nghiệp', () => {
    expect(layTenHienThiDoiTac({ taxId: '0101234567' }, 'a@b.vn')).toBe('0101234567');
  });

  it('lùi về email khi hồ sơ trống', () => {
    expect(layTenHienThiDoiTac({}, 'a@b.vn')).toBe('a@b.vn');
    expect(layTenHienThiDoiTac(undefined, 'a@b.vn')).toBe('a@b.vn');
    expect(layTenHienThiDoiTac(null, 'a@b.vn')).toBe('a@b.vn');
  });

  it('bỏ qua tên chỉ gồm khoảng trắng', () => {
    expect(layTenHienThiDoiTac({ businessName: '   ', taxId: '0101234567' }, 'a@b.vn')).toBe(
      '0101234567'
    );
  });

  it('cắt khoảng trắng thừa hai đầu tên', () => {
    expect(layTenHienThiDoiTac({ businessName: '  Đại An  ' }, 'a@b.vn')).toBe('Đại An');
  });
});

describe('khachDongYNhanEmail', () => {
  it('KHÔNG gửi khi khách bỏ tick nhận thông báo', () => {
    // Ô tick này trước đây được lưu nhưng không ai đọc — khách bỏ tick vẫn
    // nhận email.
    expect(khachDongYNhanEmail({ clientSubscribesToEmails: false })).toBe(false);
  });

  it('gửi khi khách để nguyên tick', () => {
    expect(khachDongYNhanEmail({ clientSubscribesToEmails: true })).toBe(true);
  });

  it('gửi với yêu cầu cũ chưa có trường này (không im lặng cắt thông báo)', () => {
    expect(khachDongYNhanEmail({})).toBe(true);
    expect(khachDongYNhanEmail({ clientSubscribesToEmails: undefined })).toBe(true);
  });

  it('chỉ đúng giá trị false mới chặn, không chặn nhầm giá trị rỗng', () => {
    // Phòng trường hợp ai đó đổi sang so sánh kiểu !giá_trị, khiến chuỗi rỗng
    // hay số 0 cũng bị coi là từ chối nhận email.
    expect(khachDongYNhanEmail({ clientSubscribesToEmails: '' as never })).toBe(true);
    expect(khachDongYNhanEmail({ clientSubscribesToEmails: 0 as never })).toBe(true);
  });
});
