/**
 * Tổng hợp phiếu nhận xét học viên thành số liệu CÔNG KHAI cho trang chủ.
 *
 * Hàm thuần, không đụng Firestore, để test được bằng vitest. Cloud Function
 * `tongHopPhanHoiHocVien` (index.js) gọi hàm này mỗi khi có phiếu mới rồi ghi
 * kết quả vào `congKhai/phanHoiHocVien` — tài liệu duy nhất mà khách vãng
 * lai đọc được. Phiếu gốc (có họ tên, đơn vị) vẫn khoá kín, chỉ admin xem.
 *
 * Nguyên tắc: chỉ hiện số đếm được thật. Không tô hồng, không làm tròn lên.
 */

const TIEU_CHI = ['noiDung', 'giangVien', 'taiLieu', 'toChuc', 'tongThe'];

/** Dưới ngưỡng này trang chủ KHÔNG hiện — "5,0 sao từ 1 phiếu" trông lố hơn là không có. */
const SO_PHIEU_TOI_THIEU = 5;

/** Số câu nhận xét tối đa đưa lên trang chủ. */
const SO_NHAN_XET_NOI_BAT = 6;

const NHAN_VI_TRI = {
  'cong-nhan': 'Công nhân',
  'to-truong': 'Tổ trưởng',
  'can-bo-an-toan': 'Cán bộ an toàn',
  'quan-ly': 'Quản lý',
  khac: 'Học viên',
};

const diemHopLe = (d) => Number.isInteger(d) && d >= 1 && d <= 5;

const lamTron1 = (x) => Math.round(x * 10) / 10;

/**
 * @param {Array<object>} phieu  Toàn bộ tài liệu `feedbacks` (kèm `id`).
 * @param {number} [bayGio]     Mốc thời gian ghi vào capNhatLuc (ms), mặc định Date.now().
 */
function tongHopPhanHoi(phieu, bayGio = Date.now()) {
  const hopLe = phieu.filter((p) => p && p.ratings && diemHopLe(p.ratings.tongThe));

  const soPhieu = hopLe.length;
  const soLop = new Set(hopLe.map((p) => p.sessionId).filter(Boolean)).size;

  const diemTieuChi = {};
  for (const tc of TIEU_CHI) {
    const ds = hopLe.map((p) => p.ratings[tc]).filter(diemHopLe);
    diemTieuChi[tc] = ds.length ? lamTron1(ds.reduce((a, b) => a + b, 0) / ds.length) : null;
  }

  // Phân bố sao của "đánh giá chung" — để trang chủ vẽ thanh 5★/4★/... như
  // các trang bán hàng, khách nhìn là hiểu ngay.
  const phanBoTongThe = [0, 0, 0, 0, 0];
  for (const p of hopLe) phanBoTongThe[p.ratings.tongThe - 1] += 1;

  const soGioiThieu = hopLe.filter((p) => p.gioiThieu === true).length;

  // Nhận xét nổi bật: CHỈ những phiếu admin đã bật `hienTrangChu`. Không tự
  // chọn theo điểm cao — câu chữ học viên có thể nêu tên người, tên đơn vị
  // hay chuyện nội bộ, phải có mắt người duyệt trước khi ra công khai.
  // Ẩn họ tên; chỉ ghi vị trí + đơn vị để người đọc thấy là người thật.
  const nhanXetNoiBat = hopLe
    .filter((p) => p.hienTrangChu === true && (p.huuIch || p.gopY))
    .sort((a, b) => thoiGian(b) - thoiGian(a))
    .slice(0, SO_NHAN_XET_NOI_BAT)
    .map((p) => ({
      id: p.id,
      noiDung: String(p.huuIch || p.gopY).trim().slice(0, 300),
      nguoi: [NHAN_VI_TRI[p.viTri] || 'Học viên', p.donVi].filter(Boolean).join(' · '),
      diem: p.ratings.tongThe,
    }));

  return {
    duDuLieu: soPhieu >= SO_PHIEU_TOI_THIEU,
    soPhieu,
    soLop,
    diemChung: diemTieuChi.tongThe,
    diemTieuChi,
    phanBoTongThe,
    tiLeGioiThieu: soPhieu ? Math.round((soGioiThieu / soPhieu) * 100) : null,
    nhanXetNoiBat,
    capNhatLuc: bayGio,
  };
}

function thoiGian(p) {
  const c = p.createdAt;
  if (!c) return 0;
  if (typeof c.toMillis === 'function') return c.toMillis();
  if (typeof c === 'number') return c;
  if (c instanceof Date) return c.getTime();
  return 0;
}

module.exports = { tongHopPhanHoi, SO_PHIEU_TOI_THIEU, SO_NHAN_XET_NOI_BAT };
