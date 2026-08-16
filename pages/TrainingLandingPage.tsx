import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

export type TrainingTypeKey =
  | 'an-toan-dien'
  | 'an-toan-xay-dung'
  | 'an-toan-hoa-chat'
  | 'pccc'
  | 'an-toan-buc-xa'
  | 'quan-trac-moi-truong'
  | 'danh-gia-phan-loai-lao-dong'
  | 'so-cap-cuu';

// Dữ liệu chi tiết cho từng loại đào tạo
const trainingData: Record<
  string,
  {
    title: string;
    description: string;
    metaDescription: string;
    keywords: string[];
    benefits: string[];
    targetAudience: string[];
    content: string[];
    requirements: string[];
    duration: string;
    certificate: string;
    imageUrl: string;
    bgColor: string;
    iconClass: string;
  }
> = {
  'an-toan-dien': {
    title: 'Huấn Luyện An Toàn Điện Trực Tuyến & Online',
    description:
      'Khóa huấn luyện an toàn điện trực tuyến, online lý thuyết kết hợp thực hành chuyên nghiệp, đầy đủ kỹ năng vận hành, sửa chữa điện an toàn theo quy định Nhà nước',
    metaDescription:
      'Huấn luyện an toàn điện trực tuyến (online) phối hợp thực hành thực tế, cấp chứng chỉ nhanh theo Nghị định 44. Tiết kiệm thời gian, tối ưu chi phí cho doanh nghiệp.',
    keywords: [
      'huấn luyện an toàn điện trực tuyến',
      'đào tạo an toàn điện online',
      'chứng chỉ an toàn điện',
      'huấn luyện điện công nghiệp',
      'an toàn lao động điện',
      'nghị định 44',
    ],
    benefits: [
      'Hiểu rõ các nguy cơ điện và cách phòng tránh',
      'Thực hành vận hành thiết bị điện an toàn',
      'Xử lý sự cố điện hiệu quả',
      'Đạt chứng chỉ theo quy định Nhà nước',
      'Giảm thiểu tai nạn lao động do điện',
      'Nâng cao năng lực nghề nghiệp',
    ],
    targetAudience: [
      'Công nhân điện, thợ điện',
      'Kỹ sư vận hành hệ thống điện',
      'Cán bộ quản lý an toàn điện',
      'Người làm việc gần thiết bị điện',
      'Doanh nghiệp có hoạt động liên quan điện',
    ],
    content: [
      'Kiến thức cơ bản về điện và an toàn điện',
      'Các quy định pháp luật về an toàn điện',
      'Thiết bị bảo vệ điện và cách sử dụng',
      'Vận hành an toàn thiết bị điện',
      'Sơ cứu người bị điện giật',
      'Xử lý sự cố điện phổ biến',
      'Kiểm tra và bảo trì hệ thống điện',
      'Thực hành an toàn điện trong thực tế',
    ],
    requirements: [
      'Trên 18 tuổi',
      'Sức khỏe tốt, không mắc bệnh nghề nghiệp',
      'Có kiến thức cơ bản về điện (ưu tiên)',
      'Mang theo CMND/CCCD',
    ],
    duration: '3-5 ngày (20-40 giờ)',
    certificate: 'Chứng chỉ An Toàn Điện theo Nghị định 44/2016/NĐ-CP',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=400&fit=crop',
    bgColor: 'from-yellow-500 to-orange-600',
    iconClass: 'fa-bolt',
  },
  'an-toan-xay-dung': {
    title: 'Huấn Luyện An Toàn Xây Dựng Trực Tuyến & Online',
    description:
      'Khóa huấn luyện an toàn xây dựng online và trực tiếp toàn diện, trang bị kiến thức và kỹ năng làm việc an toàn tại công trường xây dựng',
    metaDescription:
      'Huấn luyện an toàn xây dựng trực tuyến, online kết hợp thực hành công trường cho công nhân và kỹ sư. Cấp chứng chỉ an toàn lao động xây dựng hợp pháp nhanh chóng.',
    keywords: [
      'huấn luyện an toàn xây dựng online',
      'đào tạo an toàn xây dựng trực tuyến',
      'huấn luyện công trường',
      'chứng chỉ xây dựng',
      'an toàn lao động xây dựng',
      'nghị định 44',
    ],
    benefits: [
      'Nhận biết nguy hiểm tại công trường',
      'Sử dụng thiết bị bảo hộ đúng cách',
      'Làm việc trên cao an toàn',
      'Phòng ngừa tai nạn lao động',
      'Tuân thủ quy định an toàn xây dựng',
      'Cấp chứng chỉ hợp lệ toàn quốc',
    ],
    targetAudience: [
      'Công nhân xây dựng',
      'Kỹ sư giám sát công trình',
      'Chủ đầu tư, nhà thầu',
      'Quản đốc công trường',
      'Cán bộ ATVSLĐ trong xây dựng',
    ],
    content: [
      'Quy định pháp luật về an toàn xây dựng',
      'Nhận diện nguy cơ tại công trường',
      'Thiết bị bảo hộ cá nhân (PPE)',
      'An toàn làm việc trên cao',
      'An toàn giàn giáo, thang máy công trình',
      'Phòng chống sập đổ, vùi lấp',
      'Sơ cứu tai nạn tại công trường',
      'Kế hoạch ứng phó khẩn cấp',
    ],
    requirements: [
      'Trên 18 tuổi',
      'Sức khỏe đủ tiêu chuẩn làm việc xây dựng',
      'Không có chống chỉ định sức khỏe',
      'Mang theo CMND/CCCD và ảnh 3x4',
    ],
    duration: '3-7 ngày (24-56 giờ)',
    certificate: 'Chứng chỉ An Toàn Xây Dựng theo Nghị định 44/2016/NĐ-CP',
    imageUrl: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&h=400&fit=crop',
    bgColor: 'from-blue-500 to-cyan-600',
    iconClass: 'fa-hard-hat',
  },
  'an-toan-hoa-chat': {
    title: 'Huấn Luyện An Toàn Hóa Chất Online & Trực Tiếp',
    description:
      'Khóa huấn luyện an toàn hóa chất trực tuyến (online) phần lý thuyết và hướng dẫn thực hành xử lý, bảo quản hóa chất tại doanh nghiệp',
    metaDescription:
      'Đào tạo và huấn luyện an toàn hóa chất trực tuyến cho doanh nghiệp. Học về MSDS, phân loại hóa chất, xử lý sự cố tràn đổ hóa chất. Cấp chứng chỉ hợp lệ.',
    keywords: [
      'huấn luyện an toàn hóa chất trực tuyến',
      'đào tạo an toàn hóa chất online',
      'xử lý hóa chất',
      'MSDS',
      'chứng chỉ hóa chất',
      'an toàn lao động hóa chất',
    ],
    benefits: [
      'Hiểu rõ tính chất và nguy hiểm của hóa chất',
      'Đọc và sử dụng phiếu MSDS',
      'Bảo quản hóa chất đúng cách',
      'Xử lý sự cố tràn đổ hóa chất',
      'Sơ cứu khi tiếp xúc hóa chất',
      'Tuân thủ quy định về hóa chất',
    ],
    targetAudience: [
      'Công nhân làm việc với hóa chất',
      'Cán bộ kho hóa chất',
      'Kỹ sư an toàn hóa chất',
      'Quản lý nhà máy hóa chất',
      'Doanh nghiệp sản xuất/sử dụng hóa chất',
    ],
    content: [
      'Phân loại và nguy hiểm của hóa chất',
      'Hệ thống GHS - Global Harmonized System',
      'Đọc và hiểu phiếu MSDS',
      'Thiết bị bảo hộ khi làm việc với hóa chất',
      'Bảo quản và lưu trữ hóa chất',
      'Xử lý sự cố tràn đổ hóa chất',
      'Sơ cứu khi tiếp xúc hóa chất',
      'Quy định pháp luật về hóa chất',
    ],
    requirements: [
      'Trên 18 tuổi',
      'Sức khỏe tốt, không dị ứng',
      'Có kiến thức cơ bản về hóa học (ưu tiên)',
      'Mang theo CMND/CCCD',
    ],
    duration: '2-4 ngày (16-32 giờ)',
    certificate: 'Chứng chỉ An Toàn Hóa Chất theo quy định',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=400&fit=crop',
    bgColor: 'from-green-500 to-emerald-600',
    iconClass: 'fa-flask',
  },
  pccc: {
    title: 'Huấn Luyện Phòng Cháy Chữa Cháy (PCCC) Online & Trực Tiếp',
    description:
      'Khóa huấn luyện phòng cháy chữa cháy lý thuyết online kết hợp diễn tập thực hành chữa cháy và cứu nạn tại cơ sở',
    metaDescription:
      'Đào tạo và huấn luyện PCCC trực tuyến, online kết hợp diễn tập chữa cháy, cứu hộ cứu nạn. Cấp chứng chỉ PCCC hợp lệ theo Nghị định 136 nhanh chóng.',
    keywords: [
      'huấn luyện pccc trực tuyến',
      'đào tạo pccc online',
      'phòng cháy chữa cháy',
      'chứng chỉ pccc',
      'an toàn cháy nổ',
      'nghị định 136',
    ],
    benefits: [
      'Nhận biết nguy cơ cháy nổ',
      'Sử dụng thiết bị PCCC thành thạo',
      'Xử lý tình huống cháy hiệu quả',
      'Kỹ năng thoát hiểm và cứu nạn',
      'Tuân thủ quy định PCCC',
      'Bảo vệ tính mạng và tài sản',
    ],
    targetAudience: [
      'Nhân viên trong doanh nghiệp',
      'Cán bộ phụ trách PCCC',
      'Bảo vệ, lễ tân',
      'Quản lý tòa nhà, chung cư',
      'Chủ cơ sở kinh doanh',
    ],
    content: [
      'Cơ sở khoa học về cháy và chất cháy',
      'Phân loại cháy và phương pháp chữa cháy',
      'Thiết bị PCCC và cách sử dụng',
      'Thực hành sử dụng bình chữa cháy',
      'Kế hoạch phòng cháy và chữa cháy',
      'Thoát hiểm trong cháy nổ',
      'Sơ cứu nạn nhân vụ cháy',
      'Quy định pháp luật về PCCC',
    ],
    requirements: [
      'Trên 18 tuổi',
      'Sức khỏe tốt',
      'Không có tiền sử bệnh tim, hô hấp nghiêm trọng',
      'Mang theo CMND/CCCD',
    ],
    duration: '2-3 ngày (12-24 giờ)',
    certificate: 'Chứng chỉ PCCC theo Nghị định 136/2020/NĐ-CP',
    imageUrl: 'https://images.unsplash.com/photo-1587588354456-ae376af71a25?w=800&h=400&fit=crop',
    bgColor: 'from-red-500 to-rose-600',
    iconClass: 'fa-fire-extinguisher',
  },
  'an-toan-buc-xa': {
    title: 'Huấn Luyện An Toàn Bức Xạ Trực Tuyến & Online',
    description:
      'Khóa huấn luyện an toàn bức xạ trực tuyến phần lý thuyết phòng hộ và quản lý an toàn nguồn phóng xạ theo luật định',
    metaDescription:
      'Đào tạo và huấn luyện an toàn bức xạ online/trực tiếp cho cán bộ, nhân viên y tế. Cấp chứng chỉ an toàn bức xạ đúng quy định pháp luật.',
    keywords: [
      'đào tạo an toàn bức xạ trực tuyến',
      'huấn luyện an toàn bức xạ online',
      'chứng chỉ an toàn bức xạ',
      'phòng hộ bức xạ',
      'kiểm soát bức xạ',
    ],
    benefits: [
      'Hiểu rõ nguy cơ và tác hại của bức xạ',
      'Sử dụng thiết bị đo và phòng hộ bức xạ',
      'Quản lý an toàn nguồn phóng xạ',
      'Xử lý sự cố bức xạ an toàn',
      'Tuân thủ quy định về an toàn bức xạ',
      'Bảo vệ sức khỏe người lao động',
    ],
    targetAudience: [
      'Nhân viên y tế sử dụng thiết bị X-quang',
      'Kỹ thuật viên phòng thí nghiệm',
      'Cán bộ kiểm soát bức xạ',
      'Quản lý cơ sở có nguồn phóng xạ',
      'Doanh nghiệp sử dụng thiết bị bức xạ',
    ],
    content: [
      'Kiến thức cơ bản về bức xạ ion hóa',
      'Tác động của bức xạ lên con người',
      'Nguyên tắc phòng hộ bức xạ (Thời gian, Khoảng cách, Che chắn)',
      'Thiết bị đo và kiểm soát bức xạ',
      'Quản lý nguồn phóng xạ an toàn',
      'Quy định pháp luật về an toàn bức xạ',
      'Xử lý sự cố bức xạ',
      'Thực hành đo liều và kiểm soát',
    ],
    requirements: [
      'Trên 18 tuổi',
      'Có kiến thức cơ bản về vật lý (ưu tiên)',
      'Sức khỏe tốt',
      'Không mang thai',
      'Mang theo CMND/CCCD',
    ],
    duration: '3-5 ngày (24-40 giờ)',
    certificate: 'Chứng chỉ An Toàn Bức Xạ theo Luật Năng lượng nguyên tử',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=400&fit=crop',
    bgColor: 'from-cyan-500 to-cyan-700',
    iconClass: 'fa-radiation-alt',
  },
  'quan-trac-moi-truong': {
    title: 'Đào Tạo Quan Trắc Môi Trường',
    description:
      'Khóa đào tạo quan trắc môi trường chuyên nghiệp, trang bị kỹ năng lấy mẫu, phân tích và đánh giá chất lượng môi trường',
    metaDescription:
      'Đào tạo quan trắc môi trường nước, không khí, đất. Học lấy mẫu, phân tích môi trường. Cấp chứng chỉ quan trắc môi trường hợp lệ.',
    keywords: [
      'đào tạo quan trắc môi trường',
      'lấy mẫu môi trường',
      'phân tích môi trường',
      'chứng chỉ quan trắc',
      'giám sát môi trường',
    ],
    benefits: [
      'Nắm vững quy trình quan trắc môi trường',
      'Kỹ năng lấy mẫu nước, khí, đất',
      'Sử dụng thiết bị quan trắc hiện đại',
      'Phân tích và đánh giá chất lượng môi trường',
      'Lập báo cáo quan trắc môi trường',
      'Đáp ứng yêu cầu pháp luật về môi trường',
    ],
    targetAudience: [
      'Cán bộ môi trường doanh nghiệp',
      'Kỹ thuật viên phòng thí nghiệm',
      'Nhân viên quan trắc môi trường',
      'Quản lý hệ thống ISO 14001',
      'Doanh nghiệp có yêu cầu quan trắc môi trường',
    ],
    content: [
      'Luật Bảo vệ môi trường và các quy chuẩn',
      'Các thông số môi trường cần quan trắc',
      'Kỹ thuật lấy mẫu nước thải, nước mặt',
      'Kỹ thuật lấy mẫu không khí, khí thải',
      'Kỹ thuật lấy mẫu đất và trầm tích',
      'Sử dụng thiết bị quan trắc môi trường',
      'Bảo quản và vận chuyển mẫu',
      'Lập báo cáo kết quả quan trắc',
    ],
    requirements: [
      'Trên 18 tuổi',
      'Có kiến thức về môi trường hoặc hóa học (ưu tiên)',
      'Sức khỏe tốt',
      'Cẩn thận, tỉ mỉ trong công việc',
      'Mang theo CMND/CCCD',
    ],
    duration: '3-5 ngày (24-40 giờ)',
    certificate: 'Chứng chỉ Quan Trắc Môi Trường theo Luật Bảo vệ môi trường',
    imageUrl: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=800&h=400&fit=crop',
    bgColor: 'from-green-500 to-green-700',
    iconClass: 'fa-leaf',
  },
  'danh-gia-phan-loai-lao-dong': {
    title: 'Đào Tạo Đánh Giá Phân Loại Lao Động',
    description:
      'Khóa đào tạo đánh giá và phân loại lao động theo quy định, giúp doanh nghiệp tuân thủ pháp luật lao động',
    metaDescription:
      'Đào tạo đánh giá phân loại lao động cho HR, quản lý nhân sự. Học về định mức lao động, đánh giá năng lực. Cấp chứng chỉ hợp lệ.',
    keywords: [
      'đánh giá lao động',
      'phân loại lao động',
      'định mức lao động',
      'đánh giá năng lực',
      'quản lý nhân sự',
    ],
    benefits: [
      'Nắm vững quy định về phân loại lao động',
      'Kỹ năng đánh giá và phân loại công việc',
      'Xây dựng định mức lao động khoa học',
      'Đánh giá năng lực người lao động',
      'Xây dựng thang bảng lương hiệu quả',
      'Tuân thủ Bộ luật Lao động',
    ],
    targetAudience: [
      'Nhân viên phòng Nhân sự',
      'Quản lý nhân sự (HR Manager)',
      'Trưởng phòng, trưởng bộ phận',
      'Chuyên viên tổ chức lao động',
      'Chủ doanh nghiệp, giám đốc',
    ],
    content: [
      'Bộ luật Lao động về phân loại lao động',
      'Nguyên tắc đánh giá và phân loại công việc',
      'Phương pháp xây dựng định mức lao động',
      'Kỹ thuật đánh giá năng lực nhân viên',
      'Phân tích công việc (Job Analysis)',
      'Bảng mô tả công việc (Job Description)',
      'Xây dựng thang bảng lương',
      'Thực hành đánh giá và phân loại',
    ],
    requirements: [
      'Trên 21 tuổi',
      'Có kinh nghiệm làm việc (ưu tiên)',
      'Hiểu biết về quản lý nhân sự',
      'Mang theo CMND/CCCD',
      'Máy tính xách tay (nếu có)',
    ],
    duration: '2-3 ngày (16-24 giờ)',
    certificate: 'Chứng chỉ Đánh Giá Phân Loại Lao Động',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
    bgColor: 'from-indigo-500 to-indigo-700',
    iconClass: 'fa-clipboard-check',
  },
  'so-cap-cuu': {
    title: 'Huấn Luyện Sơ Cấp Cứu Trực Tuyến & Online',
    description:
      'Khóa huấn luyện sơ cấp cứu cơ bản online lý thuyết và thực hành băng bó, CPR xử lý chấn thương tại doanh nghiệp',
    metaDescription:
      'Đào tạo và huấn luyện sơ cấp cứu trực tuyến (online) cho cán bộ, công nhân. Học lý thuyết nhanh, thực hành thực tế, cấp chứng chỉ sơ cấp cứu hợp lệ.',
    keywords: [
      'huấn luyện sơ cấp cứu trực tuyến',
      'đào tạo sơ cấp cứu online',
      'CPR',
      'sơ cứu ban đầu',
      'chứng chỉ sơ cấp cứu',
      'first aid',
    ],
    benefits: [
      'Kỹ năng sơ cứu cơ bản',
      'CPR và sử dụng AED',
      'Xử lý chảy máu, gãy xương',
      'Cấp cứu ngừng hô hấp',
      'Tự tin xử lý tình huống khẩn cấp',
      'Cứu sống trong tình huống nguy hiểm',
    ],
    targetAudience: [
      'Nhân viên y tế doanh nghiệp',
      'Cán bộ ATVSLĐ',
      'Giáo viên, nhân viên trường học',
      'Nhân viên khách sạn, nhà hàng',
      'Mọi người muốn biết sơ cấp cứu',
    ],
    content: [
      'Nguyên tắc sơ cứu ban đầu',
      'Đánh giá tình trạng nạn nhân',
      'Hồi sức tim phổi (CPR)',
      'Sử dụng máy sốc tim tự động (AED)',
      'Xử lý chảy máu và băng bó vết thương',
      'Sơ cứu gãy xương, bong gân',
      'Sơ cứu bỏng, điện giật',
      'Xử lý sốc, ngạt, ngộ độc',
    ],
    requirements: [
      'Không giới hạn độ tuổi (khuyến khích từ 16 tuổi)',
      'Sức khỏe tốt',
      'Nhiệt tình, ham học hỏi',
      'Mang theo CMND/CCCD',
    ],
    duration: '1-2 ngày (8-16 giờ)',
    certificate: 'Chứng chỉ Sơ Cấp Cứu (First Aid Certificate)',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&h=400&fit=crop',
    bgColor: 'from-pink-500 to-red-600',
    iconClass: 'fa-medkit',
  },
};

const TrainingLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ type: string }>();
  const trainingType = (params.type || '') as TrainingTypeKey;

  const data = trainingData[trainingType];

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);
  }, [trainingType]);

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-red-600">Không tìm thấy trang</h1>
        <button onClick={() => navigate('/')} className="mt-4 text-primary hover:underline">
          ← Quay về trang chủ
        </button>
      </div>
    );
  }

  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    'name': `${data.title} trực tuyến, online & trực tiếp`,
    'description': data.metaDescription,
    'provider': {
      '@type': 'Organization',
      'name': 'SafetyConnect',
      'sameAs': 'https://antoan.web.app/'
    },
    'educationalCredentialAwarded': data.certificate,
    'offers': {
      '@type': 'Offer',
      'category': 'Education',
      'price': '0',
      'priceCurrency': 'VND',
      'description': 'Đăng ký nhận báo giá huấn luyện miễn phí từ các đối tác'
    }
  };

  // 6 trên 8 tiêu đề đã sẵn chữ "Trực Tuyến"/"Online", nên nối thêm một lần nữa
  // tạo ra những tiêu đề lặp như "…An Toàn Điện Trực Tuyến & Online Trực Tuyến,
  // Online | SafetyConnect": vừa dài quá mức Google hiển thị (~60 ký tự), vừa
  // lộ rõ là nhồi từ khoá. Chỉ nối thêm khi tiêu đề chưa có sẵn.
  const daCoTuKhoaOnline = /trực tuyến|online/i.test(data.title);
  const tieuDeSEO = daCoTuKhoaOnline
    ? `${data.title} | SafetyConnect`
    : `${data.title} Trực Tuyến, Online | SafetyConnect`;

  return (
    <div className="bg-neutral-light min-h-screen">
      <SEOHead
        title={tieuDeSEO}
        description={data.metaDescription}
        url={`https://antoan.web.app/training/${trainingType}`}
        keywords={[...data.keywords, 'huấn luyện trực tuyến', 'đào tạo online', 'học an toàn online']}
        schema={courseSchema}
      />
      {/* Hero Section */}
      <div className={`bg-gradient-to-r ${data.bgColor} text-white py-16 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          ></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <button
            onClick={() => navigate('/')}
            className="mb-4 text-white hover:text-gray-200 transition-colors flex items-center"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Quay về trang chủ
          </button>
          <div className="flex items-center mb-6">
            <i className={`fas ${data.iconClass} text-6xl mr-6`}></i>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{data.title}</h1>
              <p className="text-xl opacity-90">{data.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-8">
            <button
              onClick={() => navigate('/requests')}
              className="bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-all shadow-lg transform hover:scale-105"
            >
              <i className="fas fa-paper-plane mr-2"></i>
              Tạo Yêu Cầu Ngay
            </button>
            <button
              onClick={() => navigate('/requests')}
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-primary transition-all"
            >
              <i className="fas fa-list mr-2"></i>
              Xem Đối Tác
            </button>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Benefits */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-neutral-dark mb-4 flex items-center">
              <i className="fas fa-star text-yellow-500 mr-3"></i>
              Lợi Ích Khóa Học
            </h2>
            <ul className="space-y-3">
              {data.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <i className="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Target Audience */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-neutral-dark mb-4 flex items-center">
              <i className="fas fa-users text-blue-500 mr-3"></i>
              Đối Tượng Tham Gia
            </h2>
            <ul className="space-y-3">
              {data.targetAudience.map((audience, index) => (
                <li key={index} className="flex items-start">
                  <i className="fas fa-user-check text-primary mr-3 mt-1"></i>
                  <span>{audience}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Course Content */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-neutral-dark mb-6 flex items-center">
            <i className="fas fa-book-open text-accent mr-3"></i>
            Nội Dung Khóa Học
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.content.map((item, index) => (
              <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">
                  {index + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements and Details */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-neutral-dark mb-4 flex items-center">
              <i className="fas fa-clipboard-check text-green-500 mr-3"></i>
              Yêu Cầu
            </h3>
            <ul className="space-y-2">
              {data.requirements.map((req, index) => (
                <li key={index} className="flex items-start text-sm">
                  <i className="fas fa-angle-right text-primary mr-2 mt-1"></i>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-neutral-dark mb-4 flex items-center">
              <i className="fas fa-clock text-blue-500 mr-3"></i>
              Thời Gian
            </h3>
            <p className="text-lg">{data.duration}</p>
            <p className="text-sm text-gray-600 mt-2">
              Thời gian cụ thể tùy thuộc vào nhu cầu và lịch trình của doanh nghiệp
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-neutral-dark mb-4 flex items-center">
              <i className="fas fa-certificate text-yellow-500 mr-3"></i>
              Chứng Chỉ
            </h3>
            <p className="text-lg font-medium text-primary">{data.certificate}</p>
            <p className="text-sm text-gray-600 mt-2">Được công nhận trên toàn quốc</p>
          </div>
        </div>

        {/* CTA Section */}
        <div
          className={`bg-gradient-to-r ${data.bgColor} text-white rounded-2xl p-8 text-center shadow-xl`}
        >
          <h2 className="text-3xl font-bold mb-4">Sẵn Sàng Bắt Đầu?</h2>
          <p className="text-xl mb-6 opacity-90">
            Kết nối với các đơn vị đào tạo uy tín ngay hôm nay
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/requests')}
              className="bg-white text-primary px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition-all shadow-lg text-lg transform hover:scale-105"
            >
              <i className="fas fa-rocket mr-2"></i>
              Tạo Yêu Cầu Miễn Phí
            </button>
            <button
              onClick={() => navigate('/requests')}
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white hover:text-primary transition-all text-lg"
            >
              <i className="fas fa-search mr-2"></i>
              Tìm Đối Tác
            </button>
          </div>
          <p className="mt-6 text-sm opacity-75">
            <i className="fas fa-shield-alt mr-2"></i>
            Miễn phí 100% - Không phí ẩn - Bảo mật thông tin
          </p>
        </div>

        {/* SEO Content */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-neutral-dark mb-4">
            Tại Sao Chọn SafetyConnect Cho {data.title}?
          </h2>
          <div className="prose max-w-none">
            {/* Đoạn này trước đây ghi "mạng lưới hơn 50+ đối tác đào tạo uy tín
                trên toàn quốc" — con số không có thật, bảng partners đang trống.
                Nó lặp lại đúng thứ đã gỡ ở khối số liệu trang chủ, chỉ là sót
                lại ở đây. Nay chỉ nói đúng cơ chế hoạt động của nền tảng. */}
            <p className="text-gray-700 leading-relaxed mb-4">
              SafetyConnect là nền tảng kết nối doanh nghiệp với các đơn vị đào tạo an toàn lao
              động. Doanh nghiệp gửi một yêu cầu, các đơn vị đào tạo phù hợp sẽ gửi báo giá về để
              so sánh và lựa chọn:
            </p>
            <ul className="grid md:grid-cols-2 gap-3 mb-4">
              <li className="flex items-start">
                <i className="fas fa-check-double text-green-500 mr-2 mt-1"></i>
                <span>Đơn vị đào tạo được kiểm duyệt kỹ lưỡng</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-double text-green-500 mr-2 mt-1"></i>
                <span>Giá cả cạnh tranh, minh bạch</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-check-double text-green-500 mr-2 mt-1"></i>
                <span>Chứng chỉ hợp lệ, đúng quy định</span>
              </li>
              {/* Trước đây ghi "Hỗ trợ tư vấn miễn phí 24/7". Nền tảng do một
                  đầu mối vận hành nên cam kết 24/7 khó giữ đúng — hứa rồi không
                  làm được còn hại hơn không hứa. Nay nói đúng kênh liên hệ đang
                  có thật (hotline và Zalo ở chân trang). */}
              <li className="flex items-start">
                <i className="fas fa-check-double text-green-500 mr-2 mt-1"></i>
                <span>Tư vấn miễn phí qua điện thoại và Zalo</span>
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Việc đào tạo {data.title.toLowerCase()} không chỉ là yêu cầu bắt buộc của pháp luật mà
              còn là trách nhiệm của mỗi doanh nghiệp trong việc bảo vệ người lao động. Hãy để
              SafetyConnect giúp bạn tìm được đơn vị đào tạo phù hợp nhất!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingLandingPage;
