/**
 * Các quy tắc dùng khi đối tác gửi báo giá.
 *
 * Tách khỏi QuoteForm.tsx để test được bằng vitest — hai quy tắc dưới đây từng
 * sai âm thầm, không ai phát hiện vì chúng nằm lẫn trong hàm gửi form.
 */

interface HoSoDoiTac {
  businessName?: string;
  taxId?: string;
}

/**
 * Tên đối tác hiển thị cho khách (trong email báo giá) và cho admin.
 *
 * TRƯỚC ĐÂY lấy taxId trước tiên, nên khách nhận email thấy đơn vị báo giá tên
 * là một dãy mã số thuế 10 chữ số — không ai hiểu đó là ai, dù hồ sơ đối tác
 * vốn đã có sẵn businessName.
 *
 * Thứ tự ưu tiên: tên doanh nghiệp → mã số thuế → email.
 */
export const layTenHienThiDoiTac = (
  hoSo: HoSoDoiTac | undefined | null,
  emailDuPhong: string
): string => {
  const ten = hoSo?.businessName?.trim();
  if (ten) return ten;

  const mst = hoSo?.taxId?.trim();
  if (mst) return mst;

  return emailDuPhong;
};

/**
 * Khách có đồng ý nhận email thông báo báo giá mới không.
 *
 * Form tạo yêu cầu có ô tick "Nhận thông báo qua email khi có báo giá mới" và
 * lưu lựa chọn vào clientSubscribesToEmails. TRƯỚC ĐÂY không dòng mã nào đọc
 * trường này — khách bỏ tick vẫn bị gửi email, tức ô tick chỉ để trang trí.
 *
 * Yêu cầu tạo từ trước khi có trường này sẽ là undefined; coi như đồng ý, để
 * không im lặng cắt thông báo của dữ liệu cũ. Chỉ đúng giá trị false mới chặn.
 */
export const khachDongYNhanEmail = (yeuCau: {
  clientSubscribesToEmails?: boolean;
}): boolean => {
  return yeuCau?.clientSubscribesToEmails !== false;
};
