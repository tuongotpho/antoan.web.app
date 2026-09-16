import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  sinhMaLop,
  laMaLopHopLe,
  kiemTraPhanHoi,
  thongKePhanHoi,
  xuatCsvPhanHoi,
  GIOI_HAN,
} from '../utils/phanHoi';
import type { Feedback } from '../types';

const formHopLe = () => ({
  hoTen: '',
  donVi: 'Đội QLVH 1',
  viTri: 'cong-nhan',
  ratings: { noiDung: 5, giangVien: 4, taiLieu: 4, toChuc: 3, tongThe: 5 },
  huuIch: 'Phần treo biển cảnh báo',
  gopY: '',
  gioiThieu: true as boolean | null,
});

const bai = (phan: Partial<Feedback> = {}): Feedback => ({
  id: 'x',
  sessionId: 'K1609-7F',
  hoTen: '',
  donVi: 'Đội 1',
  viTri: 'cong-nhan',
  ratings: { noiDung: 5, giangVien: 5, taiLieu: 5, toChuc: 5, tongThe: 5 },
  huuIch: '',
  gopY: '',
  gioiThieu: true,
  createdAt: Timestamp.fromDate(new Date('2026-09-16T09:30:00')),
  ...phan,
});

describe('sinhMaLop', () => {
  it('mang ngày-tháng và 2 ký tự đuôi, không có ký tự dễ nhầm', () => {
    const ma = sinhMaLop('2026-09-16', () => 0);
    expect(ma).toBe('K1609-AA');
    expect(laMaLopHopLe(ma)).toBe(true);
  });

  it('đuôi không bao giờ chứa 0, O, 1, I, L', () => {
    for (let i = 0; i < 200; i++) {
      const ma = sinhMaLop('2026-01-05');
      expect(ma.slice(-2)).not.toMatch(/[0O1IL]/);
    }
  });

  it('chặn mã lạ ở URL', () => {
    expect(laMaLopHopLe('K1609-7F')).toBe(true);
    expect(laMaLopHopLe('abc')).toBe(false);
    expect(laMaLopHopLe('../admins')).toBe(false);
    expect(laMaLopHopLe('K1609-7F-QUA-DAI-QUA')).toBe(false);
  });
});

describe('kiemTraPhanHoi', () => {
  it('form đủ và ẩn danh là hợp lệ', () => {
    expect(kiemTraPhanHoi(formHopLe())).toEqual([]);
  });

  it('báo từng thứ còn thiếu', () => {
    const loi = kiemTraPhanHoi({
      ...formHopLe(),
      donVi: '  ',
      viTri: '',
      ratings: { noiDung: 5 },
      gioiThieu: null,
    });
    expect(loi).toHaveLength(4);
    expect(loi.join(' ')).toContain('đơn vị');
    expect(loi.join(' ')).toContain('vị trí');
    expect(loi.join(' ')).toContain('4 tiêu chí');
    expect(loi.join(' ')).toContain('giới thiệu');
  });

  it('nêu tên tiêu chí khi chỉ thiếu một', () => {
    const f = formHopLe();
    const loi = kiemTraPhanHoi({ ...f, ratings: { ...f.ratings, tongThe: 0 } });
    expect(loi).toEqual(['Chưa chấm điểm mục: Đánh giá chung về buổi học.']);
  });

  it('chặn chữ quá giới hạn — cùng ngưỡng với rules', () => {
    const f = formHopLe();
    expect(kiemTraPhanHoi({ ...f, gopY: 'x'.repeat(GIOI_HAN.vanBan + 1) })).toHaveLength(1);
    expect(kiemTraPhanHoi({ ...f, hoTen: 'x'.repeat(GIOI_HAN.hoTen + 1) })).toHaveLength(1);
    expect(kiemTraPhanHoi({ ...f, gopY: 'x'.repeat(GIOI_HAN.vanBan) })).toEqual([]);
  });
});

describe('thongKePhanHoi', () => {
  it('rỗng thì trung bình là null, không phải NaN', () => {
    const tk = thongKePhanHoi([]);
    expect(tk.soBai).toBe(0);
    expect(tk.tieuChi[0].trungBinh).toBeNull();
    expect(tk.tiLeGioiThieu).toBeNull();
  });

  it('tính trung bình làm tròn 1 chữ số và đếm phân bố', () => {
    const tk = thongKePhanHoi([
      bai({ ratings: { noiDung: 5, giangVien: 5, taiLieu: 5, toChuc: 5, tongThe: 4 } }),
      bai({ ratings: { noiDung: 4, giangVien: 5, taiLieu: 5, toChuc: 5, tongThe: 5 }, gioiThieu: false }),
      bai({ ratings: { noiDung: 4, giangVien: 5, taiLieu: 5, toChuc: 5, tongThe: 5 } }),
    ]);
    const noiDung = tk.tieuChi.find((t) => t.key === 'noiDung')!;
    expect(noiDung.trungBinh).toBe(4.3);
    expect(noiDung.phanBo).toEqual([0, 0, 0, 2, 1]);
    expect(tk.tiLeGioiThieu).toBeCloseTo(2 / 3);
  });

  it('bỏ qua điểm hỏng (ngoài 1..5) thay vì làm lệch trung bình', () => {
    const tk = thongKePhanHoi([
      bai({ ratings: { noiDung: 9, giangVien: 5, taiLieu: 5, toChuc: 5, tongThe: 5 } }),
      bai({ ratings: { noiDung: 3, giangVien: 5, taiLieu: 5, toChuc: 5, tongThe: 5 } }),
    ]);
    expect(tk.tieuChi.find((t) => t.key === 'noiDung')!.trungBinh).toBe(3);
  });
});

describe('xuatCsvPhanHoi', () => {
  it('có BOM để Excel đọc đúng tiếng Việt, và bọc ô có dấu phẩy / xuống dòng', () => {
    const csv = xuatCsvPhanHoi([
      bai({ hoTen: 'Nguyễn "Tèo" Văn A', gopY: 'Nên thêm thực hành, ví dụ\nthật' }),
    ]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const dong = csv.slice(1).split('\r\n');
    expect(dong).toHaveLength(2);
    expect(dong[0]).toContain('Đánh giá chung về buổi học');
    expect(dong[1]).toContain('"Nguyễn ""Tèo"" Văn A"');
    expect(dong[1]).toContain('"Nên thêm thực hành, ví dụ\nthật"');
    expect(dong[1]).toContain('Công nhân / người lao động trực tiếp');
    expect(dong[1]).toMatch(/,Có$/);
  });

  it('ẩn danh ghi rõ là ẩn danh', () => {
    expect(xuatCsvPhanHoi([bai()])).toContain('(ẩn danh)');
  });
});
