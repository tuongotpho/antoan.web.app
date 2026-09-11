import React, { useEffect, useState } from 'react';
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

interface TrainingFAQ {
  question: string;
  answer: string;
}

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
    faqs: TrainingFAQ[];
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
    faqs: [
      {
        question: 'Ai bắt buộc phải tham gia khóa huấn luyện an toàn điện?',
        answer: 'Tất cả người lao động làm công việc lắp đặt, vận hành, bảo dưỡng, sửa chữa hệ thống điện, thiết bị điện, trạm biến áp hoặc làm việc gần hành lang bảo vệ an toàn lưới điện (thuộc Nhóm 3 - Công việc có yêu cầu nghiêm ngặt).'
      },
      {
        question: 'Học an toàn điện online có được cấp thẻ an toàn lao động không?',
        answer: 'Học viên học lý thuyết online qua nền tảng, sau đó hoàn thành bài kiểm tra và tham gia thực hành thao tác an toàn theo quy định để được đơn vị huấn luyện cấp Thẻ an toàn lao động Nhóm 3 có giá trị 2 năm.'
      }
    ]
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
      'Cán bộ an toàn công trường',
      'Người làm việc tại công trường',
    ],
    content: [
      'Tổng quan về an toàn trong xây dựng',
      'Quy chuẩn kỹ thuật quốc gia QCVN 18:2021/BXD',
      'An toàn khi làm việc trên cao và giàn giáo',
      'An toàn điện và cơ khí tại công trường',
      'An toàn khi đào đất, hố móng, hầm',
      'Sử dụng phương tiện bảo vệ cá nhân (PPE)',
      'Quy trình ứng phó tình huống khẩn cấp',
      'Thực hành nhận diện mối nguy công trường',
    ],
    requirements: [
      'Trên 18 tuổi',
      'Sức khỏe đạt tiêu chuẩn làm việc',
      'Không sợ độ cao (đối với làm việc trên cao)',
      'Mang theo CMND/CCCD',
    ],
    duration: '2-4 ngày (16-32 giờ)',
    certificate: 'Chứng chỉ An Toàn Xây Dựng theo Nghị định 44/2016/NĐ-CP',
    imageUrl: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&h=400&fit=crop',
    bgColor: 'from-blue-500 to-indigo-600',
    iconClass: 'fa-hard-hat',
    faqs: [
      {
        question: 'Làm việc trên cao trong xây dựng được tính từ độ cao bao nhiêu mét?',
        answer: 'Theo quy chuẩn QCVN 18:2021/BXD, công việc làm ở độ cao từ 2 mét trở lên so với mặt sàn/mặt đất được coi là làm việc trên cao và bắt buộc phải có biện pháp an toàn chống rơi ngã, học an toàn Nhóm 3.'
      },
      {
        question: 'Chứng chỉ an toàn xây dựng có thời hạn bao lâu?',
        answer: 'Thẻ an toàn lao động Nhóm 3 ngành xây dựng có thời hạn 02 năm và được đào tạo định kỳ 2 năm một lần.'
      }
    ]
  },
  'an-toan-hoa-chat': {
    title: 'Huấn Luyện An Toàn Hóa Chất Online & Trực Tiếp',
    description:
      'Khóa đào tạo và huấn luyện an toàn hóa chất chuyên sâu, trang bị kiến thức phân loại, lưu trữ, sử dụng và ứng phó sự cố hóa chất theo Luật Hóa chất',
    metaDescription:
      'Đào tạo và huấn luyện an toàn hóa chất trực tuyến cho doanh nghiệp. Học về MSDS, phân loại hóa chất, xử lý sự cố tràn đổ hóa chất. Cấp chứng chỉ hợp lệ.',
    keywords: [
      'huấn luyện an toàn hóa chất trực tuyến',
      'đào tạo an toàn hóa chất online',
      'chứng chỉ hóa chất',
      'an toàn lao động hóa chất',
      'nghị định 113',
    ],
    benefits: [
      'Hiểu rõ đặc tính nguy hiểm của từng loại hóa chất',
      'Đọc và lập Phiếu an toàn hóa chất (MSDS/SDS)',
      'Sử dụng trang thiết bị bảo hộ chuyên dụng',
      'Quy trình lưu kho, bảo quản và sang chiết an toàn',
      'Kỹ năng ứng phó sự cố rò rỉ, tràn đổ hóa chất',
      'Tuân thủ đầy đủ Luật Hóa chất & Nghị định 113/2017',
    ],
    targetAudience: [
      'Công nhân trực tiếp tiếp xúc, pha chế, bốc xếp hóa chất',
      'Thủ kho hóa chất, nhân viên phòng thí nghiệm',
      'Cán bộ phụ trách quản lý hóa chất tại nhà máy',
      'Doanh nghiệp sản xuất, kinh doanh, xuất nhập khẩu hóa chất',
    ],
    content: [
      'Quy định pháp luật về quản lý an toàn hóa chất',
      'Hệ thống phân loại và ghi nhãn hóa chất GHS',
      'Đọc hiểu và áp dụng Phiếu an toàn hóa chất (MSDS/SDS)',
      'Kỹ thuật an toàn khi lưu giữ, vận chuyển hóa chất',
      'Biện pháp sơ cứu khi bị hóa chất bắn vào mắt, da, hít phải',
      'Xây dựng kế hoạch và diễn tập ứng phó sự cố hóa chất',
    ],
    requirements: [
      'Trên 18 tuổi',
      'Không mắc các bệnh về đường hô hấp hoặc dị ứng da nặng',
      'Mang theo CMND/CCCD',
    ],
    duration: '2-3 ngày (16-24 giờ)',
    certificate: 'Chứng chỉ Huấn Luyện An Toàn Hóa Chất',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=400&fit=crop',
    bgColor: 'from-purple-500 to-pink-600',
    iconClass: 'fa-flask',
    faqs: [
      {
        question: 'Ai phải được huấn luyện an toàn hóa chất theo Nghị định 113/2017/NĐ-CP?',
        answer: 'Tất cả người đứng đầu cơ sở (Nhóm 1), cán bộ chuyên trách an toàn hóa chất (Nhóm 2) và người lao động trực tiếp sản xuất, kinh doanh, bảo quản, sử dụng hóa chất (Nhóm 3).'
      }
    ]
  },
  'pccc': {
    title: 'Huấn Luyện Phòng Cháy Chữa Cháy (PCCC) Online & Trực Tiếp',
    description:
      'Chương trình huấn luyện nghiệp vụ phòng cháy, chữa cháy và cứu nạn, cứu hộ định kỳ theo Nghị định 136/2020/NĐ-CP và Nghị định 50/2024/NĐ-CP',
    metaDescription:
      'Đào tạo và huấn luyện PCCC trực tuyến, online kết hợp diễn tập chữa cháy, cứu hộ cứu nạn. Cấp chứng chỉ PCCC hợp lệ theo Nghị định 136 nhanh chóng.',
    keywords: [
      'huấn luyện pccc trực tuyến',
      'đào tạo pccc online',
      'chứng chỉ pccc',
      'an toàn cháy nổ',
      'nghị định 136',
    ],
    benefits: [
      'Nắm vững nguyên lý phát sinh cháy và biện pháp phòng ngừa',
      'Thành thạo sử dụng bình chữa cháy xách tay (khí CO2, bột MFZ)',
      'Vận hành hệ thống chữa cháy vách tường, lăng vòi phun nước',
      'Kỹ năng thoát nạn trong môi trường nhiều khói khí độc',
      'Được cấp Giấy chứng nhận huấn luyện nghiệp vụ PCCC & CNCH',
    ],
    targetAudience: [
      'Đội PCCC cơ sở, đội PCCC chuyên ngành',
      'Cán bộ, công nhân viên làm việc tại cơ sở có nguy hiểm về cháy nổ',
      'Nhân viên bảo vệ, lễ tân, quản lý tòa nhà, trung tâm thương mại',
      'Tài xế vận chuyển hàng hóa nguy hiểm về cháy nổ',
    ],
    content: [
      'Kiến thức pháp luật về PCCC & CNCH',
      'Các nguyên nhân gây cháy và biện pháp phòng cháy tại cơ sở',
      'Quy trình xử lý khi phát hiện đám cháy',
      'Thực hành sử dụng các loại bình chữa cháy dập tắt đám cháy khay xăng/bình gas',
      'Thực hành rải vòi, lắp lăng và phun nước chữa cháy',
      'Phương pháp sơ tán người và cứu tài sản khi có cháy',
    ],
    requirements: [
      'Từ 18 tuổi trở lên',
      'Sức khỏe bình thường, đủ điều kiện tham gia thực hành',
      'Mang theo CMND/CCCD',
    ],
    duration: '2-3 ngày (16-24 giờ)',
    certificate: 'Chứng nhận Huấn Luyện Nghiệp Vụ PCCC theo Nghị định 136/2020/NĐ-CP',
    imageUrl: 'https://images.unsplash.com/photo-1587588354456-ae376af71a25?w=800&h=400&fit=crop',
    bgColor: 'from-red-500 to-rose-600',
    iconClass: 'fa-fire-extinguisher',
    faqs: [
      {
        question: 'Giấy chứng nhận huấn luyện nghiệp vụ PCCC có thời hạn bao lâu?',
        answer: 'Giấy chứng nhận huấn luyện nghiệp vụ PCCC và cứu nạn, cứu hộ có thời hạn 05 năm kể từ ngày cấp theo quy định tại Nghị định 136/2020/NĐ-CP.'
      }
    ]
  },
  'an-toan-buc-xa': {
    title: 'Huấn Luyện An Toàn Bức Xạ Trực Tuyến & Online',
    description:
      'Khóa đào tạo an toàn bức xạ cho nhân viên y tế (X-quang, CT Scanner) và công nghiệp theo quy định của Luật Năng lượng nguyên tử và Bộ KH&CN',
    metaDescription:
      'Đào tạo và huấn luyện an toàn bức xạ online/trực tiếp cho cán bộ, nhân viên y tế. Cấp chứng chỉ an toàn bức xạ đúng quy định pháp luật.',
    keywords: [
      'đào tạo an toàn bức xạ trực tuyến',
      'huấn luyện an toàn bức xạ online',
      'chứng chỉ an toàn bức xạ',
      'phòng hộ bức xạ',
    ],
    benefits: [
      'Hiểu rõ bản chất bức xạ ion hóa và tác hại sinh học',
      'Nắm vững các nguyên tắc phòng hộ bức xạ (thời gian, khoảng cách, che chắn)',
      'Sử dụng liều kế cá nhân và thiết bị đo liều bức xạ',
      'Quy trình kiểm soát an toàn phòng máy X-quang, CT',
      'Cấp Giấy chứng nhận an toàn bức xạ đúng quy chuẩn',
    ],
    targetAudience: [
      'Bác sĩ, kỹ thuật viên chẩn đoán hình ảnh (X-quang, CT, MRI)',
      'Người phụ trách an toàn bức xạ tại bệnh viện, phòng khám',
      'Kỹ sư sử dụng thiết bị đo đạc, kiểm tra không phá hủy (NDT) có nguồn phóng xạ',
    ],
    content: [
      'Kiến thức cơ bản về bức xạ ion hóa và các đại lượng đo bức xạ',
      'Tác dụng sinh học của bức xạ và giới hạn liều chiếu xạ',
      'Quy định pháp luật về an toàn bức xạ hạt nhân',
      'Nguyên tắc và phương pháp phòng hộ bức xạ',
      'Kế hoạch ứng phó sự cố bức xạ tại cơ sở',
    ],
    requirements: [
      'Cán bộ y tế, kỹ thuật viên hoặc người làm việc liên quan nguồn bức xạ',
      'Mang theo CMND/CCCD và bằng cấp chuyên môn liên quan',
    ],
    duration: '2-3 ngày (16-24 giờ)',
    certificate: 'Chứng chỉ An Toàn Bức Xạ theo quy định của Bộ KH&CN',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=400&fit=crop',
    bgColor: 'from-amber-500 to-yellow-600',
    iconClass: 'fa-radiation',
    faqs: [
      {
        question: 'Chứng chỉ an toàn bức xạ có thời hạn bao lâu?',
        answer: 'Giấy chứng nhận đào tạo an toàn bức xạ có giá trị 03 năm theo quy định của Thông tư Bộ Khoa học và Công nghệ.'
      }
    ]
  },
  'quan-trac-moi-truong': {
    title: 'Đào Tạo Quan Trắc Môi Trường Lao Động',
    description:
      'Khóa đào tạo chuyên sâu về kỹ thuật đo kiểm, lấy mẫu và đánh giá các yếu tố vi khí hậu, tiếng ồn, bụi, hơi độc hại tại nơi làm việc',
    metaDescription:
      'Đào tạo quan trắc môi trường nước, không khí, đất. Học lấy mẫu, phân tích môi trường. Cấp chứng chỉ quan trắc môi trường hợp lệ.',
    keywords: [
      'đào tạo quan trắc môi trường',
      'lấy mẫu môi trường',
      'phân tích môi trường',
      'chứng chỉ quan trắc',
    ],
    benefits: [
      'Sử dụng thành thạo máy đo vi khí hậu, ồn, rung, ánh sáng, bụi',
      'Phương pháp lấy mẫu hơi khí độc hại theo tiêu chuẩn quốc gia',
      'Lập hồ sơ vệ sinh lao động và báo cáo quan trắc môi trường lao động',
      'Tư vấn các biện pháp kỹ thuật giảm thiểu ô nhiễm môi trường làm việc',
    ],
    targetAudience: [
      'Cán bộ phụ trách môi trường và an toàn tại nhà máy',
      'Nhân viên các đơn vị dịch vụ quan trắc môi trường lao động',
      'Kỹ sư y tế công cộng, sức khỏe nghề nghiệp',
    ],
    content: [
      'Quy định pháp luật về quan trắc môi trường lao động (Nghị định 44/2016)',
      'Kỹ thuật đo các yếu tố vật lý: Vi khí hậu, tiếng ồn, ánh sáng, rung động',
      'Kỹ thuật lấy mẫu và phân tích bụi toàn phần, bụi hô hấp, bụi amiang',
      'Kỹ thuật lấy mẫu hơi khí độc: CO, SO2, NOx, VOCs, dung môi hữu cơ',
      'Tổng hợp số liệu, đánh giá và lập báo cáo kết quả quan trắc',
    ],
    requirements: [
      'Tốt nghiệp trung cấp trở lên ngành môi trường, y tế công cộng, hóa học hoặc liên quan',
      'Mang theo CMND/CCCD',
    ],
    duration: '3-5 ngày (24-40 giờ)',
    certificate: 'Chứng nhận Đào Tạo Quan Trắc Môi Trường Lao Động',
    imageUrl: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=800&h=400&fit=crop',
    bgColor: 'from-emerald-500 to-teal-600',
    iconClass: 'fa-leaf',
    faqs: [
      {
        question: 'Doanh nghiệp phải thực hiện quan trắc môi trường lao động bao lâu một lần?',
        answer: 'Theo quy định tại Điều 18 Luật ATVSLĐ và Nghị định 44/2016/NĐ-CP, người sử dụng lao động phải tổ chức quan trắc môi trường lao động định kỳ ít nhất 01 năm/lần.'
      }
    ]
  },
  'danh-gia-phan-loai-lao-dong': {
    title: 'Đào Tạo Đánh Giá Phân Loại Lao Động',
    description:
      'Chương trình bồi dưỡng chuyên môn đánh giá điều kiện lao động theo Thông tư 29/2021/TT-BLĐTBXH để thực hiện chế độ bảo hiểm và hưu trí',
    metaDescription:
      'Đào tạo đánh giá phân loại lao động cho HR, quản lý nhân sự. Học về định mức lao động, đánh giá năng lực. Cấp chứng chỉ hợp lệ.',
    keywords: [
      'đánh giá lao động',
      'phân loại lao động',
      'định mức lao động',
      'quản lý nhân sự',
    ],
    benefits: [
      'Nắm vững phương pháp đánh giá điều kiện lao động theo Thông tư 29/2021/TT-BLĐTBXH',
      'Phân loại chính xác công việc nặng nhọc, độc hại, nguy hiểm (Loại IV, V, VI)',
      'Xây dựng chính sách bồi dưỡng bằng hiện vật và phụ cấp độc hại đúng luật',
      'Đảm bảo quyền lợi bảo hiểm xã hội và hưu trí sớm cho người lao động',
    ],
    targetAudience: [
      'Trưởng/Phó phòng Nhân sự (HR), cán bộ tiền lương & chế độ chính sách',
      'Cán bộ phụ trách công tác ATVSLĐ tại doanh nghiệp',
      'Đại diện ban chấp hành công đoàn cơ sở',
    ],
    content: [
      'Hệ thống tiêu chuẩn phân loại lao động theo điều kiện lao động',
      'Phương pháp đánh giá các yếu tố đánh giá điều kiện lao động (Hệ sinh lý lao động, Tâm lý lao động, Vệ sinh môi trường)',
      'Tính toán điểm số và xác định loại điều kiện lao động (Loại I đến Loại VI)',
      'Lập hồ sơ kết quả đánh giá phân loại và thông báo cho người lao động',
    ],
    requirements: [
      'Cán bộ nhân sự, quản lý an toàn hoặc công đoàn tại doanh nghiệp',
      'Mang theo CMND/CCCD',
    ],
    duration: '2-3 ngày (16-24 giờ)',
    certificate: 'Chứng nhận Đào Tạo Đánh Giá Phân Loại Điều Kiện Lao Động',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
    bgColor: 'from-cyan-500 to-blue-600',
    iconClass: 'fa-clipboard-check',
    faqs: [
      {
        question: 'Phân loại điều kiện lao động loại IV, V, VI mang lại quyền lợi gì cho người lao động?',
        answer: 'Người lao động làm nghề, công việc nặng nhọc, độc hại, nguy hiểm (loại IV, V, VI) được hưởng thêm ngày nghỉ phép năm, bồi dưỡng bằng hiện vật và có thể nghỉ hưu ở tuổi thấp hơn theo Luật BHXH.'
      }
    ]
  },
  'so-cap-cuu': {
    title: 'Huấn Luyện Sơ Cấp Cứu Trực Tuyến & Online',
    description:
      'Khóa huấn luyện kỹ năng sơ cấp cứu tai nạn lao động tại chỗ theo Thông tư 19/2016/TT-BYT, trang bị kỹ năng xử lý cấp bách cứu sống nạn nhân',
    metaDescription:
      'Đào tạo và huấn luyện sơ cấp cứu trực tuyến (online) cho cán bộ, công nhân. Học lý thuyết nhanh, thực hành thực tế, cấp chứng chỉ sơ cấp cứu hợp lệ.',
    keywords: [
      'huấn luyện sơ cấp cứu trực tuyến',
      'đào tạo sơ cấp cứu online',
      'CPR',
      'sơ cứu ban đầu',
      'chứng chỉ sơ cấp cứu',
    ],
    benefits: [
      'Thành thạo kỹ thuật hồi sinh tim phổi (CPR) và hô hấp nhân tạo',
      'Kỹ năng băng bó cầm máu khẩn cấp các loại vết thương',
      'Cố định tạm thời gãy xương bằng nẹp chuẩn y tế',
      'Sơ cứu nạn nhân bị điện giật, đuối nước, bỏng, say nắng',
      'Cấp Giấy chứng nhận sơ cấp cứu có giá trị pháp lý',
    ],
    targetAudience: [
      'Lực lượng sơ cấp cứu cơ sở tại nhà máy, công trường, văn phòng',
      'Cán bộ y tế cơ sở, an toàn vệ sinh viên, giáo viên, nhân viên cứu hộ',
      'Mọi cá nhân muốn trang bị kỹ năng bảo vệ tính mạng bản thân và người xung quanh',
    ],
    content: [
      'Nguyên tắc chung trong sơ cấp cứu và đánh giá tình trạng nạn nhân',
      'Kỹ thuật hồi sinh tim phổi (CPR): Ép tim ngoài lồng ngực + hà hơi thổi ngạt',
      'Kỹ thuật băng bó vết thương và các kiểu băng cơ bản',
      'Kỹ thuật cầm máu tạm thời và garô đúng cách',
      'Kỹ thuật cố định gãy xương các chi và cột sống',
      'Vận chuyển nạn nhân an toàn đến cơ sở y tế',
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
    faqs: [
      {
        question: 'Doanh nghiệp bắt buộc phải có bao nhiêu người được đào tạo sơ cấp cứu?',
        answer: 'Theo Thông tư 19/2016/TT-BYT, mỗi ca làm việc phải bố trí người lao động làm công tác sơ cứu, cấp cứu tương ứng với số lượng lao động và mức độ rủi ro tại nơi làm việc.'
      }
    ]
  },
};

const TrainingLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ type: string }>();
  const trainingType = (params.type || '') as TrainingTypeKey;
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // PHẢI dùng hasOwnProperty, KHÔNG được viết thẳng `trainingData[trainingType]`.
  const data = Object.prototype.hasOwnProperty.call(trainingData, trainingType)
    ? trainingData[trainingType]
    : undefined;

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);
  }, [trainingType]);

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEOHead
          title="Không tìm thấy khoá huấn luyện | SafetyConnect"
          description="Lĩnh vực huấn luyện này không có trên hệ thống."
        />
        <h1 className="text-3xl font-bold text-red-600">Không tìm thấy khoá huấn luyện</h1>
        <p className="mt-3 text-gray-600">
          Lĩnh vực này không có trên hệ thống. Xem các lĩnh vực đang có ở trang chủ.
        </p>
        <button onClick={() => navigate('/')} className="mt-4 text-primary hover:underline">
          ← Quay về trang chủ
        </button>
      </div>
    );
  }

  const coursePageUrl = `https://antoan.web.app/training/${trainingType}`;

  const courseGraphSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Course',
        '@id': `${coursePageUrl}#course`,
        'name': `${data.title} trực tuyến, online & trực tiếp`,
        'description': data.metaDescription,
        'url': coursePageUrl,
        'image': data.imageUrl,
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
          'description': 'Đăng ký nhận báo giá huấn luyện an toàn lao động miễn phí từ các đối tác đủ điều kiện'
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${coursePageUrl}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Trang chủ',
            'item': 'https://antoan.web.app/'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Huấn luyện an toàn',
            'item': 'https://antoan.web.app/#courses'
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': data.title,
            'item': coursePageUrl
          }
        ]
      },
      ...(data.faqs && data.faqs.length > 0 ? [{
        '@type': 'FAQPage',
        '@id': `${coursePageUrl}#faq`,
        'mainEntity': data.faqs.map(f => ({
          '@type': 'Question',
          'name': f.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': f.answer
          }
        }))
      }] : [])
    ]
  };

  const daCoTuKhoaOnline = /trực tuyến|online/i.test(data.title);
  const tieuDeSEO = daCoTuKhoaOnline
    ? `${data.title} | SafetyConnect`
    : `${data.title} Trực Tuyến, Online | SafetyConnect`;

  return (
    <div className="bg-neutral-light min-h-screen">
      <SEOHead
        title={tieuDeSEO}
        description={data.metaDescription}
        image={data.imageUrl}
        url={coursePageUrl}
        keywords={[...data.keywords, 'huấn luyện trực tuyến', 'đào tạo online', 'học an toàn online', 'chứng chỉ an toàn']}
        schema={courseGraphSchema}
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
              onClick={() => navigate('/documents')}
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-primary transition-all"
            >
              <i className="fas fa-book mr-2"></i>
              Tài Liệu Đào Tạo
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary">
                <i className="fas fa-clock text-2xl text-primary mb-2"></i>
                <h3 className="font-bold text-gray-800">Thời Lượng</h3>
                <p className="text-gray-600">{data.duration}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                <i className="fas fa-certificate text-2xl text-green-500 mb-2"></i>
                <h3 className="font-bold text-gray-800">Chứng Chỉ</h3>
                <p className="text-gray-600 text-sm">{data.certificate}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                <i className="fas fa-laptop-house text-2xl text-blue-500 mb-2"></i>
                <h3 className="font-bold text-gray-800">Hình Thức</h3>
                <p className="text-gray-600">Trực Tuyến / Online + Trực Tiếp</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-neutral-dark mb-4 flex items-center">
                <i className="fas fa-star text-yellow-500 mr-3"></i>
                Lợi Ích Khóa Huấn Luyện
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mr-3 mt-1"></i>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Audience */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-neutral-dark mb-4 flex items-center">
                <i className="fas fa-users text-blue-500 mr-3"></i>
                Đối Tượng Tham Gia
              </h2>
              <ul className="space-y-3">
                {data.targetAudience.map((audience, index) => (
                  <li key={index} className="flex items-start">
                    <i className="fas fa-user-check text-primary mr-3 mt-1"></i>
                    <span className="text-gray-700">{audience}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Course Content */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-neutral-dark mb-4 flex items-center">
                <i className="fas fa-book-open text-primary mr-3"></i>
                Nội Dung Khóa Học
              </h2>
              <div className="space-y-3">
                {data.content.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start p-3 bg-neutral-light rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-neutral-dark mb-4 flex items-center">
                <i className="fas fa-clipboard-list text-purple-500 mr-3"></i>
                Điều Kiện Tham Gia
              </h2>
              <ul className="space-y-2">
                {data.requirements.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <i className="fas fa-info-circle text-purple-500 mr-3 mt-1"></i>
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Course Specific FAQs */}
            {data.faqs && data.faqs.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-neutral-dark mb-4 flex items-center">
                  <i className="fas fa-question-circle text-orange-500 mr-3"></i>
                  Câu Hỏi Thường Gặp Về {data.title}
                </h2>
                <div className="space-y-3">
                  {data.faqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full text-left p-4 bg-gray-50 flex items-center justify-between font-semibold text-gray-800 hover:bg-gray-100 transition"
                        >
                          <span>{faq.question}</span>
                          <i className={`fas fa-chevron-down text-sm transition-transform ${isOpen ? 'rotate-180 text-primary' : 'text-gray-400'}`}></i>
                        </button>
                        {isOpen && (
                          <div className="p-4 bg-white text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* CTA Card */}
            <div className="bg-gradient-to-br from-primary to-orange-600 text-white rounded-lg shadow-xl p-6 sticky top-24">
              <h3 className="text-2xl font-bold mb-4">Đăng Ký Nhận Báo Giá</h3>
              <p className="mb-6 opacity-90">
                Gửi yêu cầu đào tạo để nhận báo giá chi tiết và tư vấn miễn phí từ các đơn vị huấn
                luyện uy tín.
              </p>
              <button
                onClick={() => navigate('/requests')}
                className="w-full bg-white text-primary py-3 rounded-lg font-bold hover:bg-gray-100 transition-all shadow-md mb-3 transform hover:scale-105"
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Tạo Yêu Cầu Đào Tạo
              </button>
              <p className="text-xs text-center opacity-75">
                <i className="fas fa-check mr-1"></i> Miễn phí 100% - Không cam kết
              </p>
            </div>

            {/* Other Courses */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-gray-800 text-lg mb-4">Các Khóa Huấn Luyện Khác</h3>
              <div className="space-y-3">
                {Object.entries(trainingData)
                  .filter(([key]) => key !== trainingType)
                  .map(([key, course]) => (
                    <div
                      key={key}
                      onClick={() => navigate(`/training/${key}`)}
                      className="flex items-center p-3 rounded-lg hover:bg-neutral-light cursor-pointer transition-colors"
                    >
                      <i className={`fas ${course.iconClass} text-primary text-xl mr-3 w-6`}></i>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-sm">{course.title}</h4>
                        <p className="text-xs text-gray-500">{course.duration}</p>
                      </div>
                      <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-12 bg-gradient-to-r from-neutral-dark to-gray-800 text-white rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sẵn Sàng Huấn Luyện {data.title}?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Hơn hàng trăm doanh nghiệp đã kết nối và tổ chức đào tạo an toàn thành công qua SafetyConnect.
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
