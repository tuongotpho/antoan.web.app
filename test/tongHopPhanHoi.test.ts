import { describe, it, expect } from 'vitest';
// File CommonJS phía Cloud Functions, không có khai báo kiểu.
import { tongHopPhanHoi, SO_PHIEU_TOI_THIEU } from '../functions/tongHopPhanHoi.js';

const phieu = (them: Record<string, unknown> = {}) => ({
  id: 'p',
  sessionId: 'K1609-7F',
  hoTen: 'Nguyễn Văn A',
  donVi: 'Đội QLVH 1',
  viTri: 'cong-nhan',
  ratings: { noiDung: 5, giangVien: 5, taiLieu: 4, toChuc: 4, tongThe: 5 },
  huuIch: 'Phần treo biển',
  gopY: '',
  gioiThieu: true,
  createdAt: 1_000,
  ...them,
});

describe('tongHopPhanHoi — số liệu công khai cho trang chủ', () => {
  it('rỗng thì duDuLieu = false, không có NaN', () => {
    const kq = tongHopPhanHoi([], 123);
    expect(kq.duDuLieu).toBe(false);
    expect(kq.soPhieu).toBe(0);
    expect(kq.diemChung).toBeNull();
    expect(kq.tiLeGioiThieu).toBeNull();
    expect(kq.capNhatLuc).toBe(123);
  });

  it(`dưới ${SO_PHIEU_TOI_THIEU} phiếu thì chưa đủ dữ liệu để trưng ra`, () => {
    const ds = Array.from({ length: SO_PHIEU_TOI_THIEU - 1 }, (_, i) => phieu({ id: `p${i}` }));
    expect(tongHopPhanHoi(ds).duDuLieu).toBe(false);
    ds.push(phieu({ id: 'them' }));
    expect(tongHopPhanHoi(ds).duDuLieu).toBe(true);
  });

  it('tính đúng điểm, số lớp, phân bố, tỉ lệ giới thiệu', () => {
    const kq = tongHopPhanHoi([
      phieu({ id: 'a', ratings: { noiDung: 5, giangVien: 5, taiLieu: 5, toChuc: 5, tongThe: 5 } }),
      phieu({ id: 'b', ratings: { noiDung: 4, giangVien: 5, taiLieu: 5, toChuc: 5, tongThe: 4 }, gioiThieu: false }),
      phieu({ id: 'c', sessionId: 'K2009-AB', ratings: { noiDung: 4, giangVien: 4, taiLieu: 3, toChuc: 4, tongThe: 4 } }),
    ]);
    expect(kq.soPhieu).toBe(3);
    expect(kq.soLop).toBe(2);
    expect(kq.diemChung).toBe(4.3);
    expect(kq.diemTieuChi.taiLieu).toBe(4.3);
    expect(kq.phanBoTongThe).toEqual([0, 0, 0, 2, 1]);
    expect(kq.tiLeGioiThieu).toBe(67);
  });

  it('bỏ qua phiếu hỏng (thiếu điểm chung) thay vì làm sập tổng hợp', () => {
    const kq = tongHopPhanHoi([phieu(), { id: 'hong' }, phieu({ id: 'x', ratings: { tongThe: 9 } })]);
    expect(kq.soPhieu).toBe(1);
  });

  it('nhận xét nổi bật: CHỈ phiếu admin đã bật, ẩn họ tên, mới nhất trước, tối đa 6', () => {
    const ds = [
      phieu({ id: 'khongBat', huuIch: 'Không được lộ' }),
      ...Array.from({ length: 8 }, (_, i) =>
        phieu({ id: `bat${i}`, hienTrangChu: true, huuIch: `Nhận xét ${i}`, createdAt: 1_000 + i, viTri: 'to-truong' })
      ),
      phieu({ id: 'batNhungTrong', hienTrangChu: true, huuIch: '', gopY: '' }),
    ];
    const kq = tongHopPhanHoi(ds);
    expect(kq.nhanXetNoiBat).toHaveLength(6);
    expect(kq.nhanXetNoiBat[0].noiDung).toBe('Nhận xét 7');
    expect(kq.nhanXetNoiBat[0].nguoi).toBe('Tổ trưởng · Đội QLVH 1');
    const chuoi = JSON.stringify(kq);
    expect(chuoi).not.toContain('Nguyễn Văn A');
    expect(chuoi).not.toContain('Không được lộ');
    expect(chuoi).not.toContain('hoTen');
  });

  it('nhận xét quá dài bị cắt ở 300 ký tự', () => {
    const kq = tongHopPhanHoi([phieu({ hienTrangChu: true, huuIch: 'x'.repeat(500) })]);
    expect(kq.nhanXetNoiBat[0].noiDung).toHaveLength(300);
  });
});
