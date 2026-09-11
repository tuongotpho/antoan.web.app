import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

export const HOME_FAQS: FAQItem[] = [
  {
    question: 'Huấn luyện an toàn lao động trực tuyến (Online) có hợp pháp và được cấp chứng chỉ không?',
    answer:
      'Tùy loại huấn luyện. Với huấn luyện an toàn điện, Nghị định 62/2025/NĐ-CP (Điều 26 khoản 3) cho phép phần lý thuyết học trực tiếp hoặc trực tuyến, phần thực hành bắt buộc trực tiếp. Với huấn luyện ATVSLĐ nhóm 1–6 theo Nghị định 44/2016/NĐ-CP, văn bản không quy định riêng hình thức trực tuyến; việc tổ chức học lý thuyết online do đơn vị huấn luyện đủ điều kiện thực hiện theo chương trình đã công bố, còn phần thực hành và sát hạch vẫn phải làm trực tiếp. Giấy chứng nhận hoặc Thẻ an toàn lao động do đơn vị huấn luyện đủ điều kiện cấp.',
    category: 'Hình thức đào tạo',
  },
  {
    question: 'Doanh nghiệp nào bắt buộc phải tổ chức huấn luyện an toàn vệ sinh lao động (ATVSLĐ)?',
    answer:
      'Theo Luật An toàn, vệ sinh lao động số 84/2015/QH13, tất cả người sử dụng lao động thuộc mọi thành phần kinh tế, doanh nghiệp, hợp tác xã, cơ sở sản xuất kinh doanh có thuê mướn hoặc sử dụng lao động tại Việt Nam đều bắt buộc phải tổ chức huấn luyện ATVSLĐ cho người lao động theo định kỳ.',
    category: 'Quy định pháp luật',
  },
  {
    question: 'Hệ thống huấn luyện an toàn lao động gồm những nhóm đối tượng nào?',
    answer:
      'Hệ thống gồm 6 nhóm: Nhóm 1 (Người quản lý phụ trách ATVSLĐ), Nhóm 2 (Cán bộ chuyên trách/bán chuyên trách an toàn), Nhóm 3 (Người làm công việc có yêu cầu nghiêm ngặt: điện, làm việc trên cao, hóa chất, hàn cắt, không gian kín...), Nhóm 4 (Người lao động phổ thông, nhân viên văn phòng), Nhóm 5 (Người làm công tác y tế cơ sở), Nhóm 6 (An toàn vệ sinh viên tại các tổ sản xuất).',
    category: 'Phân loại nhóm',
  },
  {
    question: 'Thời hạn hiệu lực của Giấy chứng nhận và Thẻ an toàn lao động là bao lâu?',
    answer:
      'Giấy chứng nhận huấn luyện (Nhóm 1, 2, 5, 6) và Thẻ an toàn lao động (Nhóm 3) có thời hạn hiệu lực là 02 năm kể từ ngày cấp. Đối với Nhóm 4, kết quả huấn luyện được ghi vào Sổ theo dõi huấn luyện và doanh nghiệp phải tổ chức huấn luyện định kỳ ít nhất 01 năm/lần.',
    category: 'Chứng chỉ & Thời hạn',
  },
  {
    question: 'Doanh nghiệp gửi yêu cầu nhận báo giá trên SafetyConnect có mất phí không?',
    answer:
      'Hoàn toàn miễn phí 100%. SafetyConnect cung cấp nền tảng kết nối trực tuyến giúp doanh nghiệp đăng tải yêu cầu đào tạo nhanh chóng và nhận báo giá cạnh tranh nhất từ các đơn vị huấn luyện có Giấy chứng nhận đủ điều kiện hoạt động theo Nghị định 44/2016/NĐ-CP, không chịu chi phí trung gian nào.',
    category: 'Dịch vụ SafetyConnect',
  },
  {
    question: 'Đơn vị nào sẽ trực tiếp huấn luyện và cấp chứng chỉ cho doanh nghiệp?',
    answer:
      'Các đơn vị trực tiếp đào tạo và cấp chứng chỉ là các Trung tâm, Viện hoặc Công ty huấn luyện ATVSLĐ đã được cơ quan quản lý nhà nước về ATVSLĐ (hiện nay là Bộ Nội vụ, trước năm 2025 là Bộ LĐ-TB&XH) cấp Giấy chứng nhận đủ điều kiện hoạt động huấn luyện Hạng A, B hoặc C theo Nghị định 44/2016/NĐ-CP. Hạng A huấn luyện nhóm 1, 4, 6; Hạng B thêm nhóm 3; Hạng C thêm nhóm 2.',
    category: 'Đối tác đào tạo',
  },
];

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden" id="faq-section">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-3">
            <i className="fas fa-question-circle mr-1.5"></i> Câu Hỏi Thường Gặp
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Giải Đáp Thắc Mắc Về Huấn Luyện An Toàn Lao Động
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Tổng hợp các thông tin pháp lý, hình thức đào tạo trực tuyến / trực tiếp và quy trình nhận báo giá theo Nghị định 44/2016/NĐ-CP & Nghị định 62/2025/NĐ-CP.
          </p>
        </div>

        <div className="space-y-4">
          {HOME_FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`border rounded-2xl transition-all duration-300 overflow-hidden bg-white shadow-sm ${
                  isOpen ? 'border-primary/40 ring-2 ring-primary/10 shadow-md' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-gray-900 text-base md:text-lg flex items-center gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    {faq.question}
                  </span>
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${
                      isOpen ? 'bg-primary text-white rotate-180' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <i className="fas fa-chevron-down text-sm"></i>
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-gray-600 leading-relaxed border-t border-gray-100 text-sm md:text-base animate-fadeIn">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA box under FAQs */}
        <div className="mt-12 p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 text-center flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-lg">Bạn còn thắc mắc nào khác?</h3>
            <p className="text-gray-600 text-sm">Đội ngũ chuyên gia an toàn lao động sẵn sàng tư vấn miễn phí cho bạn.</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/requests"
              className="px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-orange-600 transition shadow-sm text-sm"
            >
              <i className="fas fa-paper-plane mr-1.5"></i> Đăng yêu cầu báo giá
            </Link>
            <Link
              to="/documents"
              className="px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition text-sm"
            >
              <i className="fas fa-book mr-1.5"></i> Xem kho tài liệu
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
