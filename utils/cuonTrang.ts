/**
 * Cuộn trang có tôn trọng tuỳ chọn "giảm chuyển động" của người dùng.
 *
 * VẤN ĐỀ THẬT ĐÃ ĐO ĐƯỢC:
 *
 * Khi người dùng bật "giảm chuyển động" trong hệ điều hành, lệnh cuộn mượt
 * (`behavior: 'smooth'`) KHÔNG chạy — trang đứng yên tại chỗ. Đo trên trình
 * duyệt có bật tuỳ chọn này:
 *
 *     scrollIntoView({ behavior: 'smooth' })  → vị trí cuộn vẫn là 0
 *     scrollIntoView()                        → cuộn tới 6092
 *
 * Hậu quả: bấm nút "Tạo Yêu Cầu" thì về được trang chủ nhưng không cuộn tới
 * form, người dùng tưởng nút hỏng. Đúng nhóm người đã cần được ưu ái hơn —
 * họ bật tuỳ chọn đó vì say chuyển động, vì động kinh, hoặc vì máy yếu.
 *
 * Cách xử lý đúng không phải là bỏ hiệu ứng mượt cho tất cả, mà là: ai muốn
 * mượt thì được mượt, ai xin giảm chuyển động thì nhảy thẳng tới nơi — miễn là
 * ai cũng tới được đích.
 */

/** Người dùng có xin giảm chuyển động không. */
export const muonGiamChuyenDong = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/** Kiểu cuộn phù hợp với tuỳ chọn của người dùng. */
export const kieuCuon = (): ScrollBehavior => (muonGiamChuyenDong() ? 'auto' : 'smooth');

/** Cuộn tới một phần tử. Trả về false nếu không tìm thấy phần tử. */
export const cuonToi = (phanTu: Element | null | undefined, block: ScrollLogicalPosition = 'start'): boolean => {
  if (!phanTu) return false;
  phanTu.scrollIntoView({ behavior: kieuCuon(), block });
  return true;
};

/** Cuộn tới một phần tử theo id. Trả về false nếu không tìm thấy. */
export const cuonToiId = (id: string, block: ScrollLogicalPosition = 'start'): boolean =>
  cuonToi(document.getElementById(id), block);

/** Cuộn lên đầu trang. */
export const cuonLenDau = (): void => {
  window.scrollTo({ top: 0, behavior: kieuCuon() });
};
