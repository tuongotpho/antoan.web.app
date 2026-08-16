/**
 * Các quy tắc lọc danh sách yêu cầu huấn luyện.
 *
 * Tách khỏi RequestsPage để test được — hai quy tắc dưới đây từng sai âm thầm,
 * kiểu sai mà nhìn giao diện không thể phát hiện.
 */

interface ChiTietHuanLuyen {
  type?: string;
  group?: string;
  participants?: number;
}

interface YeuCauRutGon {
  location?: string;
  description?: string;
  trainingDetails?: ChiTietHuanLuyen[];
}

/**
 * Mức cao nhất của thanh trượt số học viên, mang nghĩa "không giới hạn".
 *
 * Giao diện bộ lọc cũng hiểu như vậy: nó chỉ tính là "đang lọc" khi giá trị
 * NHỎ HƠN mức này.
 */
export const KHONG_GIOI_HAN_HOC_VIEN = 1000;

/** Cộng tổng học viên của mọi nội dung huấn luyện trong một yêu cầu. */
export const tinhTongHocVien = (yeuCau: YeuCauRutGon | null | undefined): number => {
  if (!yeuCau?.trainingDetails) return 0;
  return yeuCau.trainingDetails.reduce((tong, ct) => tong + (Number(ct?.participants) || 0), 0);
};

/**
 * Yêu cầu có lọt qua bộ lọc số học viên không.
 *
 * TRƯỚC ĐÂY áp dụng `tổng <= max` vô điều kiện. Vì max mặc định là 1000, một
 * yêu cầu 1500 học viên bị ẩn khỏi danh sách dù người dùng chưa đặt bộ lọc nào
 * — tức âm thầm giấu đi chính những khách hàng lớn nhất.
 */
export const lotQuaLocSoHocVien = (
  yeuCau: YeuCauRutGon,
  min: number,
  max: number
): boolean => {
  const tong = tinhTongHocVien(yeuCau);
  if (tong < min) return false;
  if (max >= KHONG_GIOI_HAN_HOC_VIEN) return true;
  return tong <= max;
};

/**
 * Yêu cầu có khớp từ khoá tìm kiếm không.
 *
 * TRƯỚC ĐÂY gọi thẳng `req.location.toLowerCase()`, nên chỉ cần MỘT yêu cầu
 * thiếu trường đó là cả danh sách vỡ ngay khi người dùng gõ vào ô tìm kiếm —
 * hỏng nguyên trang chứ không phải hỏng một dòng.
 */
export const khopTuKhoa = (yeuCau: YeuCauRutGon, tuKhoa: string): boolean => {
  const q = tuKhoa.trim().toLowerCase();
  if (!q) return true;

  const diaDiem = (yeuCau?.location ?? '').toLowerCase();
  const moTa = (yeuCau?.description ?? '').toLowerCase();
  const loaiHinh =
    yeuCau?.trainingDetails?.some((ct) => (ct?.type ?? '').toLowerCase().includes(q)) || false;

  return diaDiem.includes(q) || moTa.includes(q) || loaiHinh;
};
