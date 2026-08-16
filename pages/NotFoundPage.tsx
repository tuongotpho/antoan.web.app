import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

/**
 * Trang "không tìm thấy".
 *
 * TRƯỚC ĐÂY router bắt mọi địa chỉ lạ rồi lặng lẽ chuyển hướng về trang chủ.
 * Với người dùng thì khó hiểu (bấm một link hỏng lại thấy trang chủ, tưởng bị
 * lỗi), còn với Google thì đó là "soft 404": máy chủ trả về trang bình thường
 * cho một địa chỉ không tồn tại, nên Google vẫn đưa địa chỉ rác vào chỉ mục rồi
 * đánh giá thấp cả website.
 *
 * Nay hiện hẳn một trang riêng, đặt noindex, và chỉ đường sang các mục có thật.
 */
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const cacLoiTat = [
    { duongDan: '/', nhan: 'Trang chủ', icon: 'fa-house' },
    { duongDan: '/requests', nhan: 'Yêu cầu huấn luyện', icon: 'fa-list-check' },
    { duongDan: '/blog', nhan: 'Blog & kiến thức', icon: 'fa-newspaper' },
    { duongDan: '/documents', nhan: 'Tài liệu & biểu mẫu', icon: 'fa-folder-open' },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <SEOHead
        title="Không tìm thấy trang | SafetyConnect"
        description="Địa chỉ này không tồn tại trên SafetyConnect."
        // noindex: đây là trang lỗi, không nên nằm trong kết quả tìm kiếm.
        keywords={[]}
      />
      <div className="max-w-xl mx-auto text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <i className="fas fa-map-signs text-3xl text-primary"></i>
        </div>

        <p className="text-6xl font-extrabold text-primary mb-3">404</p>
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-dark mb-4">
          Không tìm thấy trang này
        </h1>
        <p className="text-gray-600 mb-2">
          Địa chỉ <code className="bg-gray-100 px-2 py-0.5 rounded text-sm break-all">
            {location.pathname}
          </code> không tồn tại.
        </p>
        <p className="text-gray-600 mb-8">
          Có thể đường dẫn bị gõ nhầm, hoặc nội dung đã được chuyển đi nơi khác.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cacLoiTat.map((m) => (
            <button
              key={m.duongDan}
              onClick={() => navigate(m.duongDan)}
              className="border border-gray-200 bg-white rounded-lg px-5 py-4 text-left hover:border-primary hover:shadow-sm transition-all flex items-center gap-3"
            >
              <i className={`fas ${m.icon} text-primary`}></i>
              <span className="font-semibold text-neutral-dark">{m.nhan}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
