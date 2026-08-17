import { describe, it, expect } from 'vitest';
import { gomTheoThang, doiVeNgay, mucCaoNhat, xepHangLoaiHinh } from '../utils/thongKeThang';

const mocThoiGian = new Date('2026-08-17T10:00:00Z'); // tháng 8/2026

describe('doiVeNgay', () => {
  it('nhận Date thường', () => {
    const d = new Date('2026-05-10');
    expect(doiVeNgay(d)?.getFullYear()).toBe(2026);
  });

  it('nhận Firestore Timestamp có toDate', () => {
    const ts = { toDate: () => new Date('2026-05-10') };
    expect(doiVeNgay(ts)?.getMonth()).toBe(4); // tháng 5
  });

  it('nhận dạng có seconds', () => {
    const ts = { seconds: Math.floor(new Date('2026-05-10').getTime() / 1000) };
    expect(doiVeNgay(ts)?.getFullYear()).toBe(2026);
  });

  it('trả về null khi thiếu hoặc hỏng', () => {
    expect(doiVeNgay(null)).toBeNull();
    expect(doiVeNgay(undefined)).toBeNull();
    expect(doiVeNgay(new Date('không phải ngày'))).toBeNull();
    expect(doiVeNgay({} as never)).toBeNull();
  });
});

describe('gomTheoThang', () => {
  it('luôn trả đủ số tháng yêu cầu, kể cả tháng trống', () => {
    const cot = gomTheoThang([], [], 6, mocThoiGian);
    expect(cot).toHaveLength(6);
    expect(cot.every((c) => c.soYeuCau === 0 && c.soDoiTac === 0)).toBe(true);
  });

  it('tháng cuối cùng là tháng hiện tại', () => {
    const cot = gomTheoThang([], [], 6, mocThoiGian);
    expect(cot[cot.length - 1].thang).toBe(8);
    expect(cot[cot.length - 1].nam).toBe(2026);
  });

  it('sắp xếp từ tháng cũ tới tháng mới', () => {
    const cot = gomTheoThang([], [], 6, mocThoiGian);
    expect(cot.map((c) => c.thang)).toEqual([3, 4, 5, 6, 7, 8]);
  });

  it('đếm đúng yêu cầu và đối tác theo từng tháng', () => {
    const yeuCau = [
      { createdAt: new Date('2026-08-05') },
      { createdAt: new Date('2026-08-16') },
      { createdAt: new Date('2026-07-02') },
    ];
    const doiTac = [{ createdAt: new Date('2026-08-10') }];
    const cot = gomTheoThang(yeuCau, doiTac, 6, mocThoiGian);
    const t8 = cot.find((c) => c.thang === 8)!;
    const t7 = cot.find((c) => c.thang === 7)!;
    expect(t8.soYeuCau).toBe(2);
    expect(t8.soDoiTac).toBe(1);
    expect(t7.soYeuCau).toBe(1);
    expect(t7.soDoiTac).toBe(0);
  });

  it('bỏ qua bản ghi ngoài khoảng thời gian', () => {
    const yeuCau = [
      { createdAt: new Date('2025-01-01') }, // quá cũ
      { createdAt: new Date('2026-08-01') },
    ];
    const cot = gomTheoThang(yeuCau, [], 6, mocThoiGian);
    const tong = cot.reduce((s, c) => s + c.soYeuCau, 0);
    expect(tong).toBe(1);
  });

  it('không nhầm cùng tháng nhưng khác năm', () => {
    // Tháng 8/2025 không được tính vào cột tháng 8/2026
    const yeuCau = [{ createdAt: new Date('2025-08-15') }];
    const cot = gomTheoThang(yeuCau, [], 6, mocThoiGian);
    expect(cot.reduce((s, c) => s + c.soYeuCau, 0)).toBe(0);
  });

  it('bắc qua ranh giới năm cho đúng', () => {
    const mocThang2 = new Date('2026-02-10');
    const cot = gomTheoThang([], [], 6, mocThang2);
    expect(cot.map((c) => `${c.thang}/${c.nam}`)).toEqual([
      '9/2025',
      '10/2025',
      '11/2025',
      '12/2025',
      '1/2026',
      '2/2026',
    ]);
  });

  it('không vỡ khi bản ghi thiếu ngày tạo', () => {
    const yeuCau = [{ createdAt: null }, {}, { createdAt: new Date('2026-08-01') }];
    expect(() => gomTheoThang(yeuCau, [], 6, mocThoiGian)).not.toThrow();
    const cot = gomTheoThang(yeuCau, [], 6, mocThoiGian);
    expect(cot.reduce((s, c) => s + c.soYeuCau, 0)).toBe(1);
  });
});

describe('mucCaoNhat', () => {
  it('lấy giá trị lớn nhất giữa cả hai loại', () => {
    const cot = gomTheoThang(
      [{ createdAt: new Date('2026-08-01') }, { createdAt: new Date('2026-08-02') }],
      [{ createdAt: new Date('2026-08-03') }],
      6,
      mocThoiGian
    );
    expect(mucCaoNhat(cot)).toBe(2);
  });

  it('không bao giờ trả về 0 — tránh chia cho 0 khi tính chiều cao cột', () => {
    expect(mucCaoNhat(gomTheoThang([], [], 6, mocThoiGian))).toBe(1);
  });
});

describe('xepHangLoaiHinh — tỉ lệ không được vượt 100%', () => {
  it('một yêu cầu chọn nhiều loại vẫn cho tổng tỉ lệ đúng 100%', () => {
    // Đây là lỗi cũ: mẫu số lấy SỐ YÊU CẦU trong khi tử số đếm SỐ LƯỢT CHỌN.
    // Với 2 yêu cầu mà tổng 4 lượt chọn, tỉ lệ cũ sẽ ra 100% + 100% = 200%.
    const yeuCau = [
      { trainingDetails: [{ type: 'An toàn điện' }, { type: 'PCCC' }] },
      { trainingDetails: [{ type: 'An toàn điện' }, { type: 'Sơ cấp cứu' }] },
    ];
    const kq = xepHangLoaiHinh(yeuCau, 5);
    const tongTiLe = kq.reduce((s, x) => s + x.tiLe, 0);
    expect(tongTiLe).toBeLessThanOrEqual(100);
    expect(kq[0].loai).toBe('An toàn điện');
    expect(kq[0].soLuot).toBe(2);
    expect(kq[0].tiLe).toBe(50); // 2 trên 4 lượt
  });

  it('xếp theo số lượt giảm dần', () => {
    const yeuCau = [
      { trainingDetails: [{ type: 'A' }] },
      { trainingDetails: [{ type: 'B' }] },
      { trainingDetails: [{ type: 'B' }] },
      { trainingDetails: [{ type: 'C' }] },
      { trainingDetails: [{ type: 'C' }] },
      { trainingDetails: [{ type: 'C' }] },
    ];
    expect(xepHangLoaiHinh(yeuCau, 3).map((x) => x.loai)).toEqual(['C', 'B', 'A']);
  });

  it('chỉ lấy đúng số hạng mục yêu cầu', () => {
    const yeuCau = [
      { trainingDetails: [{ type: 'A' }, { type: 'B' }, { type: 'C' }, { type: 'D' }] },
    ];
    expect(xepHangLoaiHinh(yeuCau, 2)).toHaveLength(2);
  });

  it('trả về mảng rỗng khi chưa có dữ liệu', () => {
    expect(xepHangLoaiHinh([])).toEqual([]);
    expect(xepHangLoaiHinh([{ trainingDetails: [] }])).toEqual([]);
  });

  it('bỏ qua mục thiếu loại hình, không vỡ', () => {
    const yeuCau = [
      { trainingDetails: [{ type: '' }, { type: '   ' }, {}, { type: 'An toàn điện' }] },
      {},
    ];
    expect(() => xepHangLoaiHinh(yeuCau)).not.toThrow();
    const kq = xepHangLoaiHinh(yeuCau);
    expect(kq).toHaveLength(1);
    expect(kq[0].tiLe).toBe(100);
  });
});
