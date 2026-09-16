import { Timestamp } from './services/firebaseConfig';

// Cấu trúc cho một mục đào tạo chi tiết
export interface TrainingDetail {
  type: string;
  group: string; // e.g., "Nhóm 1 (NĐ 44)" or "Không áp dụng"
  participants: number;
}

export interface TrainingRequest {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  trainingDetails: TrainingDetail[]; // Mảng các chi tiết đào tạo
  trainingDuration: string; // Thời gian huấn luyện dự kiến
  preferredTime: string; // Thời điểm huấn luyện dự kiến
  description: string;
  location: string;
  createdAt: Timestamp;
  viewedBy: string[]; // Array of user UIDs who have viewed the contact info
  urgent: boolean; // True if the request is urgent
  clientSubscribesToEmails: boolean; // True if client wants to receive email notifications
}

export interface PartnerProfile {
  uid: string;
  email: string;
  taxId: string;
  address: string;
  phone: string;
  notableClients: string;
  capabilities: string[];
  subscribesToEmails: boolean;
  status: 'pending' | 'approved' | 'rejected';
  membership: 'free' | 'premium';
  createdAt: Timestamp;
  // New fields for trusted partners feature
  businessName?: string; // Tên doanh nghiệp
  website?: string; // Địa chỉ website
  logo?: string; // URL logo
  description?: string; // Mô tả ngắn về doanh nghiệp
  establishedYear?: number; // Năm thành lập
  featured?: boolean; // Có được hiển thị trên trang chủ không
  displayOrder?: number; // Thứ tự hiển thị (cho featured partners)
  verified?: boolean; // Trạng thái xác nhận đặc biệt (khác với approved)
}

export interface Document {
  id: string;
  title: string;
  description: string;
  downloadUrl: string;
  fileName: string;
  createdAt: Timestamp;
  viewCount: number;
  downloadCount: number;
}

export interface Quote {
  id: string;
  requestId: string; // ID của training request
  partnerId: string; // UID của partner
  partnerEmail: string; // Email của partner
  partnerName: string; // Tên công ty/partner (từ taxId hoặc email)
  price: number; // Giá báo (VND)
  currency: string; // Đơn vị tiền tệ (default: 'VND')
  timeline: string; // Thời gian thực hiện (ví dụ: "3-5 ngày", "1 tuần")
  notes: string; // Ghi chú, chi tiết về báo giá
  attachments?: string[]; // URL của các file đính kèm (nếu có)
  status: 'pending' | 'accepted' | 'rejected'; // Trạng thái báo giá
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Chat System Types
export interface ChatRoom {
  id: string;
  requestId: string; // ID của training request liên quan
  clientId: string; // UID của client (hoặc email nếu không có account)
  partnerId: string; // UID của partner
  clientName: string;
  partnerName: string;
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: {
    client: number;
    partner: number;
  };
  createdAt: Timestamp;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string; // UID của người gửi
  senderName: string;
  senderRole: 'client' | 'partner' | 'admin';
  message: string;
  read: boolean;
  createdAt: Timestamp;
  // File attachments
  attachment?: {
    url: string;
    name: string;
    type: string; // 'image' | 'document' | 'pdf'
    size: number; // file size in bytes
  };
}

// Blog System Types
export interface BlogPost {
  id: string;
  title: string;
  slug: string; // URL-friendly version of title
  excerpt: string; // Short summary for card display
  content: string; // Full content (HTML or Markdown)
  coverImage: string; // URL của ảnh bìa
  category: string; // Danh mục: "An toàn lao động", "Luật lệ", "Case study", etc.
  tags: string[]; // Các tag liên quan
  author: {
    uid: string;
    name: string;
    email: string;
  };
  published: boolean; // True nếu đã publish, false nếu còn draft
  viewCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

export interface BlogComment {
  id: string;
  postId: string; // ID của blog post
  authorId: string; // UID của người comment
  authorName: string;
  authorEmail: string;
  authorRole: 'admin' | 'user'; // Admin hoặc user thường
  content: string; // Nội dung comment
  images?: string[]; // Mảng URL của ảnh đính kèm
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Hằng số cho các nhóm đào tạo trong form
export const TRAINING_GROUPS = [
  'Không áp dụng',
  'Nhóm 1 (NĐ 44)',
  'Nhóm 2 (NĐ 44)',
  'Nhóm 3 (NĐ 44)',
  'Nhóm 4 (NĐ 44)',
  'Nhóm 5 (NĐ 44)',
  'Nhóm 6 (NĐ 44)',
];

export const DECREE_44_GROUPS = [
  // Giữ lại để tham khảo
  'Đào tạo Nhóm 1 (NĐ 44)',
  'Đào tạo Nhóm 2 (NĐ 44)',
  'Đào tạo Nhóm 3 (NĐ 44)',
  'Đào tạo Nhóm 4 (NĐ 44)',
  'Đào tạo Nhóm 5 (NĐ 44)',
  'Đào tạo Nhóm 6 (NĐ 44)',
];

// For clients to choose from when creating a request
export const TRAINING_TYPES = [
  'An toàn điện',
  'An toàn xây dựng',
  'An toàn hóa chất',
  'Phòng cháy chữa cháy (PCCC)',
  'An toàn bức xạ',
  'Quan trắc môi trường',
  'Đánh giá phân loại lao động',
  'Sơ cấp cứu',
  'Khác (Vui lòng ghi rõ)',
];

// For partners to select their capabilities during registration
export const PARTNER_CAPABILITIES = [
  'An toàn điện',
  'An toàn xây dựng',
  'An toàn hóa chất',
  'Phòng cháy chữa cháy (PCCC)',
  'An toàn bức xạ',
  'Quan trắc môi trường',
  'Đánh giá phân loại lao động',
  'Sơ cấp cứu',
  'Huấn luyện chung (Nhiều lĩnh vực)',
];

// Trusted Training Partner Types
export interface TrustedPartner {
  id: string;
  businessName: string; // Tên doanh nghiệp
  taxId: string; // Mã số thuế
  website: string; // Địa chỉ website
  logo?: string; // URL logo (optional)
  description: string; // Mô tả ngắn về doanh nghiệp
  specializations: string[]; // Các lĩnh vực chuyên môn
  address: string; // Địa chỉ trụ sở
  phone: string; // Số điện thoại
  email: string; // Email liên hệ
  establishedYear?: number; // Năm thành lập (optional)
  certifications?: string[]; // Các chứng chỉ, giấy phép (optional)
  notableClients?: string[]; // Khách hàng tiêu biểu (optional)
  verified: boolean; // Trạng thái xác nhận
  featured: boolean; // Có được hiển thị trên trang chủ không
  displayOrder?: number; // Thứ tự hiển thị
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Helper function to convert PartnerProfile to TrustedPartner format
export function partnerProfileToTrustedPartner(partner: PartnerProfile): TrustedPartner {
  // Create professional business name from email if not provided
  const getBusinessName = (businessName: string | undefined, email: string): string => {
    if (businessName && businessName.trim() !== '') {
      return businessName.trim();
    }

    // Extract from email and capitalize
    const emailPrefix = email.split('@')[0];
    return emailPrefix
      .split(/[-_.]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Create professional description based on specializations
  const getDescription = (description: string | undefined, capabilities: string[]): string => {
    // Ignore placeholder or empty descriptions
    if (
      description &&
      description.trim() !== '' &&
      description.trim().toLowerCase() !== 'description'
    ) {
      return description.trim();
    }

    if (capabilities && capabilities.length > 0) {
      const mainSpec = capabilities[0];
      return `Đơn vị đào tạo chuyên về ${mainSpec} và các lĩnh vực an toàn lao động khác`;
    }

    return 'Đơn vị đào tạo an toàn lao động uy tín';
  };

  return {
    id: partner.uid,
    businessName: getBusinessName(partner.businessName, partner.email),
    taxId: partner.taxId,
    website: partner.website || '',
    logo: partner.logo,
    description: getDescription(partner.description, partner.capabilities || []),
    specializations: partner.capabilities || [],
    address: partner.address,
    phone: partner.phone,
    email: partner.email,
    establishedYear: partner.establishedYear,
    certifications: [],
    notableClients: partner.notableClients ? [partner.notableClients] : [],
    verified: partner.verified || false,
    featured: partner.featured || false,
    displayOrder: partner.displayOrder,
    createdAt: partner.createdAt,
    updatedAt: partner.createdAt,
  };
}

// === PHẢN HỒI HỌC VIÊN SAU BUỔI GIẢNG AN TOÀN ===
//
// Mỗi buổi giảng là một "lớp" (FeedbackSession) có mã ngắn riêng, in thành
// QR. Học viên quét QR, điền form không cần đăng nhập, ra một Feedback.
// Một QR cho MỖI lớp — không dùng QR chung — để kết quả gắn đúng lớp và
// đóng được từng lớp sau khi hết hạn nhận xét.

/** Khoá của 5 tiêu chí chấm sao. Giữ nguyên thứ tự này khi hiển thị. */
export const TIEU_CHI_PHAN_HOI = [
  { key: 'noiDung', label: 'Nội dung bài giảng dễ hiểu, sát thực tế' },
  { key: 'giangVien', label: 'Giảng viên truyền đạt rõ ràng, trả lời được câu hỏi' },
  { key: 'taiLieu', label: 'Tài liệu, hình ảnh, ví dụ minh hoạ' },
  { key: 'toChuc', label: 'Thời lượng và tổ chức lớp học' },
  { key: 'tongThe', label: 'Đánh giá chung về buổi học' },
] as const;

export type TieuChiKey = (typeof TIEU_CHI_PHAN_HOI)[number]['key'];

export const VI_TRI_HOC_VIEN = [
  { key: 'cong-nhan', label: 'Công nhân / người lao động trực tiếp' },
  { key: 'to-truong', label: 'Tổ trưởng / đội trưởng' },
  { key: 'can-bo-an-toan', label: 'Cán bộ an toàn' },
  { key: 'quan-ly', label: 'Quản lý / lãnh đạo' },
  { key: 'khac', label: 'Khác' },
] as const;

export type ViTriHocVien = (typeof VI_TRI_HOC_VIEN)[number]['key'];

export interface FeedbackSession {
  /** Mã lớp ngắn, cũng là id tài liệu. Ví dụ: K1609-7F */
  id: string;
  tenKhoa: string; // Tên khoá / chủ đề buổi giảng
  ngayGiang: string; // Ngày giảng, dạng YYYY-MM-DD
  donVi: string; // Đơn vị học viên (tuỳ chọn)
  giangVien: string; // Tên giảng viên
  ghiChu: string;
  status: 'open' | 'closed'; // 'closed' = không nhận bài mới nữa
  createdAt: Timestamp;
  createdBy: string; // uid admin tạo lớp
}

export interface Feedback {
  id: string;
  sessionId: string; // Mã lớp
  hoTen: string; // Tuỳ chọn, cho phép để trống (ẩn danh)
  donVi: string; // Bắt buộc
  viTri: ViTriHocVien;
  ratings: Record<TieuChiKey, number>; // Mỗi tiêu chí 1..5
  huuIch: string; // Điều hữu ích nhất
  gopY: string; // Cần bổ sung / thay đổi
  gioiThieu: boolean; // Có giới thiệu cho đồng nghiệp không
  createdAt: Timestamp;
  /** Admin bật để đưa câu nhận xét này lên trang chủ (ẩn họ tên). */
  hienTrangChu?: boolean;
}

/**
 * Số liệu công khai ở `congKhai/phanHoiHocVien`, do Cloud Function
 * `tongHopPhanHoiHocVien` tính từ toàn bộ phiếu. Không chứa họ tên.
 * Khuôn dữ liệu định nghĩa ở functions/tongHopPhanHoi.js.
 */
export interface ThongKeCongKhai {
  duDuLieu: boolean; // false khi chưa đủ 5 phiếu → trang chủ không hiện
  soPhieu: number;
  soLop: number;
  diemChung: number | null; // trung bình "đánh giá chung", 1 chữ số thập phân
  diemTieuChi: Record<TieuChiKey, number | null>;
  phanBoTongThe: [number, number, number, number, number]; // số phiếu 1..5 sao
  tiLeGioiThieu: number | null; // phần trăm 0..100
  nhanXetNoiBat: { id: string; noiDung: string; nguoi: string; diem: number }[];
  capNhatLuc: number; // ms
}
