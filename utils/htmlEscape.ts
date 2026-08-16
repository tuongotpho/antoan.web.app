/**
 * Lọc ký tự đặc biệt trước khi ghép dữ liệu người dùng vào HTML.
 *
 * VÌ SAO CẦN: mọi mẫu email trong utils/emailTemplates.ts đều ghép thẳng tên
 * công ty, mô tả, ghi chú báo giá... vào chuỗi HTML rồi gửi đi. Không lọc thì:
 *
 *   - Tên công ty có dấu & hay < > làm vỡ cách hiển thị của email
 *   - Người gửi yêu cầu chèn được thẻ <a href="trang-lua-dao"> vào email mà
 *     hệ thống gửi cho đối tác — trông y như thư chính thức của nền tảng
 *   - Điền email dạng  x" onmouseover="...  thoát được ra khỏi thuộc tính
 *     href="mailto:..." để gắn mã vào thẻ
 *
 * Đây cùng loại lỗi đã vá ở tin nhắn Telegram, nhưng nặng hơn vì email đi
 * thẳng tới khách hàng và mang tên miền của nền tảng.
 */

/**
 * Escape 5 ký tự có ý nghĩa trong HTML.
 *
 * Khác với bản dùng cho Telegram (chỉ cần 3 ký tự): ở đây phải escape cả nháy
 * đơn và nháy kép, vì có chỗ ghép giá trị vào bên trong thuộc tính như
 * href="mailto:...".
 */
export const escapeHtml = (giaTri: unknown): string => {
  if (giaTri === null || giaTri === undefined) return '';
  return String(giaTri)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Như escapeHtml nhưng giữ lại cách xuống dòng của người dùng.
 *
 * Dùng cho ô mô tả và ghi chú báo giá — người ta gõ nhiều dòng, escape xong mà
 * không đổi ký tự xuống dòng thành <br> thì email dồn hết thành một khối chữ.
 */
export const escapeHtmlGiuXuongDong = (giaTri: unknown): string => {
  return escapeHtml(giaTri).replace(/\r\n|\r|\n/g, '<br>');
};
