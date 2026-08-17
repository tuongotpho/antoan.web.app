/**
 * Gom dữ liệu theo tháng cho biểu đồ tăng trưởng ở trang quản trị.
 *
 * Tách riêng để test được — biểu đồ trước đây vẽ bằng sáu cột có chiều cao ghi
 * cứng trong mã (40%, 60%, 50%, 75%, 65%, 85%), kèm chú thích "Yêu cầu" và
 * "Đối tác" như thể là số thật. Nhìn vào tưởng đang tăng trưởng đều, trong khi
 * nó không đọc lấy một bản ghi nào.
 */

interface CoNgayTao {
  createdAt?: { toDate?: () => Date; seconds?: number } | Date | null;
}

export interface CotThang {
  /** Nhãn hiển thị, ví dụ "T8" */
  nhan: string;
  /** Tháng 1–12 */
  thang: number;
  nam: number;
  soYeuCau: number;
  soDoiTac: number;
}

/** Đổi trường ngày của Firestore về Date thường. */
export const doiVeNgay = (gt: CoNgayTao['createdAt']): Date | null => {
  if (!gt) return null;
  if (gt instanceof Date) return isNaN(gt.getTime()) ? null : gt;
  if (typeof (gt as { toDate?: () => Date }).toDate === 'function') {
    try {
      const d = (gt as { toDate: () => Date }).toDate();
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  const giay = (gt as { seconds?: number }).seconds;
  if (typeof giay === 'number') {
    const d = new Date(giay * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

/**
 * Dựng danh sách N tháng gần nhất, tính cả tháng hiện tại, kèm số lượng đếm được.
 *
 * Luôn trả về đủ N tháng kể cả khi tháng đó không có bản ghi nào — để biểu đồ
 * không bị co lại và người xem thấy rõ tháng nào trống.
 */
export const gomTheoThang = (
  yeuCau: CoNgayTao[],
  doiTac: CoNgayTao[],
  soThang = 6,
  moc: Date = new Date()
): CotThang[] => {
  const cot: CotThang[] = [];

  for (let i = soThang - 1; i >= 0; i--) {
    const d = new Date(moc.getFullYear(), moc.getMonth() - i, 1);
    cot.push({
      nhan: `T${d.getMonth() + 1}`,
      thang: d.getMonth() + 1,
      nam: d.getFullYear(),
      soYeuCau: 0,
      soDoiTac: 0,
    });
  }

  const dem = (ds: CoNgayTao[], truong: 'soYeuCau' | 'soDoiTac') => {
    for (const bg of ds) {
      const d = doiVeNgay(bg?.createdAt);
      if (!d) continue;
      const o = cot.find((c) => c.thang === d.getMonth() + 1 && c.nam === d.getFullYear());
      if (o) o[truong]++;
    }
  };

  dem(yeuCau, 'soYeuCau');
  dem(doiTac, 'soDoiTac');

  return cot;
};

/** Giá trị lớn nhất trong bảng, dùng để tính chiều cao cột. Tối thiểu là 1. */
export const mucCaoNhat = (cot: CotThang[]): number =>
  Math.max(1, ...cot.map((c) => Math.max(c.soYeuCau, c.soDoiTac)));
