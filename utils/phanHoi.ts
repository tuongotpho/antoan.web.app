import { TIEU_CHI_PHAN_HOI, VI_TRI_HOC_VIEN, type Feedback, type TieuChiKey } from '../types';

/**
 * Hàm thuần cho tính năng phản hồi học viên: sinh mã lớp, kiểm dữ liệu form,
 * tính điểm trung bình, xuất CSV. Không đụng Firebase để test được không cần
 * emulator; phần rules có bộ test riêng.
 */

// Giới hạn độ dài — PHẢI khớp với firestore.rules (mục feedbacks).
export const GIOI_HAN = {
  hoTen: 100,
  donVi: 200,
  vanBan: 2000, // huuIch, gopY
} as const;

/**
 * Link "Viết bài đánh giá" trên Google Maps của giảng viên / đơn vị.
 *
 * Để TRỐNG thì màn hình cảm ơn không hiện nút mời đánh giá Google. Khi có Hồ sơ
 * doanh nghiệp Google: vào Google Business Profile → "Nhận thêm bài đánh giá"
 * → sao chép link (dạng https://g.page/r/xxxx/review) rồi dán vào đây.
 * Chỉ mời những học viên chấm điểm chung từ 4 sao trở lên.
 */
export const LINK_DANH_GIA_GOOGLE = '';
export const DIEM_TOI_THIEU_MOI_GOOGLE = 4;

// Bỏ các ký tự dễ đọc nhầm khi chép tay từ QR in giấy: 0/O, 1/I/L.
const BANG_CHU = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Sinh mã lớp ngắn dạng K1609-7F: K + ngày + tháng + 2 ký tự ngẫu nhiên.
 * Người dạy nhìn mã là biết ngay lớp ngày nào; 2 ký tự cuối đủ tránh trùng
 * trong cùng ngày (31² = 961 khả năng), phía gọi vẫn kiểm trùng trước khi ghi.
 */
export const sinhMaLop = (ngayGiang: string, ngauNhien: () => number = Math.random): string => {
  // ngayGiang dạng YYYY-MM-DD
  const [, thang, ngay] = ngayGiang.split('-');
  const duoi = Array.from(
    { length: 2 },
    () => BANG_CHU[Math.floor(ngauNhien() * BANG_CHU.length)]
  ).join('');
  return `K${ngay}${thang}-${duoi}`;
};

/** Mã lớp hợp lệ: chữ hoa, số, gạch ngang; 4–12 ký tự. Dùng để chặn id lạ ở URL. */
export const laMaLopHopLe = (ma: string): boolean => /^[A-Z0-9-]{4,12}$/.test(ma);

export interface DuLieuFormPhanHoi {
  hoTen: string;
  donVi: string;
  viTri: string;
  ratings: Partial<Record<TieuChiKey, number>>;
  huuIch: string;
  gopY: string;
  gioiThieu: boolean | null;
}

/**
 * Kiểm dữ liệu trước khi gửi. Trả về danh sách lỗi bằng tiếng Việt; rỗng là
 * hợp lệ. Rules phía server kiểm lại lần nữa — đây chỉ để báo lỗi sớm cho
 * người điền, không phải hàng rào bảo vệ.
 */
export const kiemTraPhanHoi = (d: DuLieuFormPhanHoi): string[] => {
  const loi: string[] = [];

  if (!d.donVi.trim()) loi.push('Vui lòng ghi đơn vị / bộ phận.');
  else if (d.donVi.trim().length > GIOI_HAN.donVi)
    loi.push(`Đơn vị quá dài (tối đa ${GIOI_HAN.donVi} ký tự).`);

  if (d.hoTen.trim().length > GIOI_HAN.hoTen)
    loi.push(`Họ tên quá dài (tối đa ${GIOI_HAN.hoTen} ký tự).`);

  if (!VI_TRI_HOC_VIEN.some((v) => v.key === d.viTri)) loi.push('Vui lòng chọn vị trí công việc.');

  const thieu = TIEU_CHI_PHAN_HOI.filter((tc) => {
    const diem = d.ratings[tc.key];
    return !Number.isInteger(diem) || (diem as number) < 1 || (diem as number) > 5;
  });
  if (thieu.length === 1) loi.push(`Chưa chấm điểm mục: ${thieu[0].label}.`);
  else if (thieu.length > 1) loi.push(`Còn ${thieu.length} tiêu chí chưa chấm điểm.`);

  if (d.huuIch.length > GIOI_HAN.vanBan || d.gopY.length > GIOI_HAN.vanBan)
    loi.push(`Phần nhận xét quá dài (tối đa ${GIOI_HAN.vanBan} ký tự mỗi ô).`);

  if (d.gioiThieu !== true && d.gioiThieu !== false)
    loi.push('Vui lòng trả lời có muốn giới thiệu khoá học không.');

  return loi;
};

export interface ThongKeTieuChi {
  key: TieuChiKey;
  label: string;
  trungBinh: number | null; // null khi chưa có bài nào
  phanBo: [number, number, number, number, number]; // số bài chấm 1..5 sao
}

export interface ThongKePhanHoi {
  soBai: number;
  tieuChi: ThongKeTieuChi[];
  tiLeGioiThieu: number | null; // 0..1
}

export const thongKePhanHoi = (ds: Feedback[]): ThongKePhanHoi => {
  const tieuChi = TIEU_CHI_PHAN_HOI.map((tc) => {
    const phanBo: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    let tong = 0;
    let dem = 0;
    for (const fb of ds) {
      const diem = fb.ratings?.[tc.key];
      if (Number.isInteger(diem) && diem >= 1 && diem <= 5) {
        phanBo[diem - 1] += 1;
        tong += diem;
        dem += 1;
      }
    }
    return {
      key: tc.key,
      label: tc.label,
      trungBinh: dem ? Math.round((tong / dem) * 10) / 10 : null,
      phanBo,
    };
  });

  const soGioiThieu = ds.filter((fb) => fb.gioiThieu === true).length;

  return {
    soBai: ds.length,
    tieuChi,
    tiLeGioiThieu: ds.length ? soGioiThieu / ds.length : null,
  };
};

const nhanViTri = (key: string): string =>
  VI_TRI_HOC_VIEN.find((v) => v.key === key)?.label ?? key;

// Excel đọc CSV: ô có dấu phẩy, ngoặc kép hay xuống dòng phải bọc ngoặc kép,
// và ngoặc kép bên trong nhân đôi.
const oCsv = (v: string | number | boolean | null | undefined): string => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Xuất CSV có BOM UTF-8 ở đầu — thiếu BOM thì Excel trên Windows mở ra toàn
 * ký tự lỗi ở chỗ có dấu tiếng Việt.
 */
export const xuatCsvPhanHoi = (ds: Feedback[]): string => {
  const dong: string[] = [];
  dong.push(
    [
      'Thời gian gửi',
      'Mã lớp',
      'Họ tên',
      'Đơn vị',
      'Vị trí',
      ...TIEU_CHI_PHAN_HOI.map((tc) => tc.label),
      'Điều hữu ích nhất',
      'Góp ý',
      'Giới thiệu cho đồng nghiệp',
    ]
      .map(oCsv)
      .join(',')
  );
  for (const fb of ds) {
    const thoiGian =
      fb.createdAt && typeof fb.createdAt.toDate === 'function'
        ? fb.createdAt.toDate().toLocaleString('vi-VN')
        : '';
    dong.push(
      [
        thoiGian,
        fb.sessionId,
        fb.hoTen || '(ẩn danh)',
        fb.donVi,
        nhanViTri(fb.viTri),
        ...TIEU_CHI_PHAN_HOI.map((tc) => fb.ratings?.[tc.key] ?? ''),
        fb.huuIch,
        fb.gopY,
        fb.gioiThieu ? 'Có' : 'Không',
      ]
        .map(oCsv)
        .join(',')
    );
  }
  return '﻿' + dong.join('\r\n');
};
