/**
 * Dựng bản ghi hồ sơ đối tác từ dữ liệu form quản trị.
 *
 * Tách khỏi component để test được. Lý do rất cụ thể: bản viết đầu tiên có ô
 * "Địa chỉ ảnh logo" trên form nhưng lại QUÊN đưa `logo` vào lệnh ghi. Người
 * nhập gõ đủ, bấm lưu, hệ thống báo thành công — mà ảnh thì mất. Không lỗi,
 * không cảnh báo, nhìn giao diện không thể phát hiện.
 *
 * Nay có một test đối chiếu từng ô trên form với từng trường được ghi, nên
 * thêm ô mới mà quên nối dây thì test đỏ ngay.
 */

export interface DuLieuFormDoiTac {
  businessName: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  description: string;
  notableClients: string;
  establishedYear: string;
  logo: string;
  capabilities: string[];
  featured: boolean;
  verified: boolean;
  displayOrder: string;
}

/** Mọi ô nhập chữ trên form. Test dùng danh sách này để soát không sót ô nào. */
export const O_NHAP_CHU: (keyof DuLieuFormDoiTac)[] = [
  'businessName',
  'taxId',
  'email',
  'phone',
  'address',
  'website',
  'description',
  'notableClients',
  'logo',
];

/**
 * Dựng lệnh cập nhật cài đặt hiển thị của một đối tác (từ hộp Chi tiết Đối tác
 * trong trang quản trị).
 *
 * Điểm mấu chốt: KHÔNG được để lọt giá trị `undefined`. Đã thử bằng chính SDK
 * Firestore — `updateDoc` ném lỗi "Unsupported field value: undefined" và huỷ
 * nguyên lệnh. Bản cũ viết `displayOrder: thuTu ? parseInt(thuTu) : undefined`,
 * nên chỉ cần ô "Thứ tự hiển thị" để trống là cả lệnh lưu hỏng: hai ô gạt "đã
 * xác minh" và "hiện trang chủ" vừa chỉnh cũng mất theo.
 */
export const dungCapNhatDoiTac = (
  verified: boolean,
  featured: boolean,
  displayOrder: string
) => {
  const thuTu = parseInt(displayOrder, 10);
  return {
    verified,
    featured,
    ...(Number.isFinite(thuTu) ? { displayOrder: thuTu } : {}),
  };
};

export const dungHoSoDoiTac = (duLieu: DuLieuFormDoiTac, maHoSo: string) => {
  const nam = parseInt(duLieu.establishedYear, 10);
  const thuTu = parseInt(duLieu.displayOrder, 10);

  return {
    uid: maHoSo,
    businessName: duLieu.businessName.trim(),
    taxId: duLieu.taxId.trim(),
    email: duLieu.email.trim(),
    phone: duLieu.phone.trim(),
    address: duLieu.address.trim(),
    website: duLieu.website.trim(),
    logo: duLieu.logo.trim(),
    description: duLieu.description.trim(),
    notableClients: duLieu.notableClients.trim(),
    capabilities: duLieu.capabilities,
    // Bỏ hẳn trường khi người nhập để trống, thay vì ghi NaN xuống cơ sở dữ liệu.
    ...(Number.isFinite(nam) ? { establishedYear: nam } : {}),
    ...(Number.isFinite(thuTu) ? { displayOrder: thuTu } : {}),
    subscribesToEmails: false,
    // Admin tự nhập thì duyệt luôn, khỏi phải qua bước phê duyệt.
    status: 'approved' as const,
    membership: 'free' as const,
    verified: duLieu.verified,
    featured: duLieu.featured,
    // Đánh dấu để phân biệt với hồ sơ do đối tác tự đăng ký.
    taoBoiQuanTri: true,
  };
};
