import { describe, it, expect } from 'vitest';
import {
  dungHoSoDoiTac,
  dungCapNhatDoiTac,
  O_NHAP_CHU,
  DuLieuFormDoiTac,
} from '../utils/hoSoDoiTac';

const mau: DuLieuFormDoiTac = {
  businessName: '  Trung tâm Huấn luyện An toàn Miền Bắc  ',
  taxId: '0101234567',
  email: 'lienhe@example.com',
  phone: '0912345678',
  address: 'Số 1, Hà Nội',
  website: 'https://example.com',
  description: 'Đơn vị huấn luyện an toàn lao động.',
  notableClients: 'EVN, Vinaconex',
  establishedYear: '2010',
  logo: 'https://example.com/logo.png',
  capabilities: ['An toàn điện', 'Sơ cấp cứu'],
  featured: true,
  verified: true,
  displayOrder: '3',
};

describe('dungHoSoDoiTac — không được đánh rơi ô nhập nào', () => {
  it('MỌI ô nhập chữ trên form đều xuống tới bản ghi', () => {
    // Đây chính là lỗi đã xảy ra: form có ô "Địa chỉ ảnh logo" nhưng lệnh ghi
    // lại thiếu `logo`. Người nhập gõ đủ, bấm lưu, hệ thống báo thành công —
    // mà ảnh thì mất, không lỗi, không cảnh báo.
    const hoSo = dungHoSoDoiTac(mau, 'ma-1') as Record<string, unknown>;

    for (const o of O_NHAP_CHU) {
      expect(hoSo, `thiếu trường "${String(o)}"`).toHaveProperty(String(o));
      expect(hoSo[String(o)], `trường "${String(o)}" rỗng`).toBe(
        String(mau[o]).trim()
      );
    }
  });

  it('cắt khoảng trắng thừa hai đầu', () => {
    expect(dungHoSoDoiTac(mau, 'ma-1').businessName).toBe(
      'Trung tâm Huấn luyện An toàn Miền Bắc'
    );
  });

  it('giữ nguyên lĩnh vực đào tạo đã chọn', () => {
    expect(dungHoSoDoiTac(mau, 'ma-1').capabilities).toEqual([
      'An toàn điện',
      'Sơ cấp cứu',
    ]);
  });

  it('đổi năm và thứ tự sang số', () => {
    const hoSo = dungHoSoDoiTac(mau, 'ma-1');
    expect(hoSo.establishedYear).toBe(2010);
    expect(hoSo.displayOrder).toBe(3);
  });

  it('BỎ HẲN năm và thứ tự khi để trống, không ghi NaN', () => {
    // parseInt('') trả về NaN. Ghi NaN xuống Firestore thì bản ghi hỏng, còn
    // phần sắp xếp trên trang chủ so sánh với NaN sẽ cho thứ tự lung tung.
    const hoSo = dungHoSoDoiTac(
      { ...mau, establishedYear: '', displayOrder: '' },
      'ma-1'
    );
    expect(hoSo).not.toHaveProperty('establishedYear');
    expect(hoSo).not.toHaveProperty('displayOrder');
  });

  it('hồ sơ admin tự nhập được duyệt sẵn và có dấu nhận biết', () => {
    const hoSo = dungHoSoDoiTac(mau, 'ma-1');
    expect(hoSo.status).toBe('approved');
    expect(hoSo.taoBoiQuanTri).toBe(true);
    expect(hoSo.uid).toBe('ma-1');
  });

  it('giữ đúng lựa chọn hiện trang chủ và nhãn xác minh', () => {
    const tat = dungHoSoDoiTac({ ...mau, featured: false, verified: false }, 'ma-2');
    expect(tat.featured).toBe(false);
    expect(tat.verified).toBe(false);
  });
});

describe('dungCapNhatDoiTac — không được để lọt undefined xuống Firestore', () => {
  it('KHÔNG có trường nào mang giá trị undefined, kể cả khi bỏ trống thứ tự', () => {
    // Đã thử bằng chính SDK: updateDoc({ displayOrder: undefined }) ném lỗi
    // "Unsupported field value: undefined" và huỷ NGUYÊN lệnh. Nghĩa là ô
    // "Thứ tự hiển thị" để trống thì hai ô gạt vừa chỉnh cũng không lưu được.
    for (const thuTu of ['', '   ', 'abc']) {
      const lenh = dungCapNhatDoiTac(true, false, thuTu) as Record<string, unknown>;
      const coUndefined = Object.entries(lenh).filter(([, v]) => v === undefined);
      expect(coUndefined, `thứ tự "${thuTu}" sinh ra undefined`).toEqual([]);
      expect(lenh).not.toHaveProperty('displayOrder');
    }
  });

  it('vẫn giữ đúng hai ô gạt khi bỏ trống thứ tự', () => {
    expect(dungCapNhatDoiTac(true, false, '')).toEqual({ verified: true, featured: false });
  });

  it('đổi thứ tự sang số khi có nhập', () => {
    expect(dungCapNhatDoiTac(false, true, '7')).toEqual({
      verified: false,
      featured: true,
      displayOrder: 7,
    });
  });

  it('nhận số 0 làm thứ tự hợp lệ, không coi là bỏ trống', () => {
    // Bản cũ dùng `displayOrder ? ... : undefined` nên số 0 bị coi như trống.
    expect(dungCapNhatDoiTac(true, true, '0')).toHaveProperty('displayOrder', 0);
  });
});
