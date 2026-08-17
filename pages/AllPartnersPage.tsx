import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { TrustedPartner, PartnerProfile, partnerProfileToTrustedPartner } from '../types';
import TrustedPartnerCard from '../components/TrustedPartnerCard';
import TrustedPartnerInfoModal from '../components/TrustedPartnerInfoModal';
import SEOHead from '../components/SEOHead';
import { cuonLenDau } from '../utils/cuonTrang';

const AllPartnersPage: React.FC = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<TrustedPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Firestore từ chối đọc bảng partners. Từ khi rules cho đọc công khai hồ sơ
  // đã duyệt, trạng thái này chỉ còn xảy ra khi rules trên máy chủ là bản cũ.
  const [loiPhanQuyen, setLoiPhanQuyen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<TrustedPartner | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');

  // Trang này công khai, KHÔNG chờ đăng nhập nữa.
  //
  // Trước đây phải đăng nhập mới xem được, vì rules khoá cả bảng partners. Nay
  // rules cho đọc công khai hồ sơ có status == 'approved', nên khách vãng lai —
  // tức đúng những người cần tìm đơn vị huấn luyện — thấy được danh sách ngay.
  //
  // Điều kiện where('status','==','approved') là BẮT BUỘC, không phải để lọc cho
  // gọn: Firestore chỉ chấp nhận truy vấn khi chắc chắn MỌI bản ghi trả về đều
  // qua được rules. Bỏ nó đi thì cả truy vấn bị từ chối.
  useEffect(() => {
    setError('');
    setLoiPhanQuyen(false);
    setLoading(true);

    const partnersCollection = collection(db, 'partners');
    // Remove orderBy from query to avoid needing composite index
    // We'll sort in JavaScript instead
    const partnersQuery = query(partnersCollection, where('status', '==', 'approved'));

    const unsubscribe = onSnapshot(
      partnersQuery,
      (querySnapshot) => {
        const partnersData = querySnapshot.docs.map((docSnap) => {
          const partnerProfile = {
            uid: docSnap.id,
            ...docSnap.data(),
          } as PartnerProfile;
          return partnerProfileToTrustedPartner(partnerProfile);
        });

        // Sort by displayOrder in JavaScript (handles missing displayOrder values)
        partnersData.sort((a, b) => {
          const orderA = a.displayOrder ?? 999999;
          const orderB = b.displayOrder ?? 999999;
          return orderA - orderB;
        });

        setPartners(partnersData);
        setLoading(false);
      },
      (err) => {
        // Từ khi rules mở cho đọc công khai hồ sơ đã duyệt, permission-denied ở
        // đây là dấu hiệu rules trên máy chủ chưa được deploy — giữ lại nhánh
        // riêng để báo cho đúng chứ không lẫn vào lỗi mạng.
        if (err?.code === 'permission-denied') {
          console.error(
            'Bị từ chối đọc bảng partners. Nhiều khả năng firestore.rules trên máy chủ vẫn là bản cũ.'
          );
          setLoiPhanQuyen(true);
          setLoading(false);
          return;
        }
        console.error('Lỗi khi tải danh sách đối tác: ', err);
        setError('Không tải được danh sách đối tác. Vui lòng thử lại sau ít phút.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Get unique specializations for filtering
  const allSpecializations = Array.from(
    new Set(partners.flatMap((p) => p.specializations || []))
  ).sort();

  // Filter partners based on search and specialization
  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      searchTerm === '' ||
      partner.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.taxId.includes(searchTerm);

    const matchesSpecialization =
      selectedSpecialization === 'all' || partner.specializations?.includes(selectedSpecialization);

    return matchesSearch && matchesSpecialization;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600">Đang tải danh sách đối tác...</p>
        </div>
      </div>
    );
  }

  if (loiPhanQuyen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        {/* Phải đặt thẻ SEO ở CẢ nhánh này. Thẻ SEO của trang nằm mãi dưới phần
            hiển thị chính, mà nhánh này thoát ra trước — nên tiêu đề tab sẽ giữ
            nguyên của trang vừa xem, mở /partners lại thấy đề "Yêu Cầu Huấn
            Luyện". */}
        <SEOHead
          title="Đối Tác Đào Tạo An Toàn Lao Động | SafetyConnect"
          description="Danh sách các đơn vị đào tạo an toàn lao động đã được xác minh."
          url="https://antoan.web.app/partners"
        />
        <div className="max-w-lg w-full bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-50 flex items-center justify-center">
            <i className="fas fa-lock text-2xl text-amber-500"></i>
          </div>
          <h1 className="text-xl font-bold text-neutral-dark mb-3">
            Chưa xem được danh sách đối tác
          </h1>
          <p className="text-gray-600 mb-6">
            Máy chủ đang từ chối truy cập dữ liệu đối tác. Đây là lỗi cấu hình phía hệ thống, không
            phải do máy của bạn. Vui lòng quay lại sau.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-dark transition-all inline-flex items-center justify-center gap-2"
            >
              <i className="fas fa-house"></i>
              Về trang chủ
            </button>
            <button
              onClick={() => navigate('/requests')}
              className="border border-gray-300 text-neutral-dark font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-all inline-flex items-center justify-center gap-2"
            >
              <i className="fas fa-list"></i>
              Xem yêu cầu huấn luyện
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center">
            <i className="fas fa-triangle-exclamation text-2xl text-red-500"></i>
          </div>
          <h1 className="text-xl font-bold text-neutral-dark mb-3">Không tải được danh sách</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-dark transition-all inline-flex items-center gap-2"
          >
            <i className="fas fa-rotate-right"></i>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Meta Tags.
          Địa chỉ chuẩn trước đây ghi 'atld.web.app' — trỏ sang website khác,
          tức tự bảo Google rằng bản gốc của trang này nằm ở nơi khác. */}
      <SEOHead
        title="Đối Tác Huấn Luyện An Toàn Lao Động Uy Tín | SafetyConnect"
        description={`Danh sách ${partners.length} đơn vị đào tạo an toàn lao động được xác nhận và đánh giá cao trên toàn quốc. Tìm kiếm đối tác phù hợp với nhu cầu của bạn.`}
        url="https://antoan.web.app/partners"
        keywords={[
          'đối tác đào tạo ATLD',
          'đơn vị huấn luyện an toàn lao động',
          'danh sách đối tác uy tín',
          'công ty đào tạo ATVSLĐ',
          ...allSpecializations,
        ]}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary to-orange-600 text-white py-16">
          <div className="container mx-auto px-4">
            <button
              onClick={() => navigate('/')}
              className="mb-6 flex items-center gap-2 text-white/90 hover:text-white transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
              <span>Quay lại trang chủ</span>
            </button>

            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                Đối Tác Huấn Luyện Uy Tín
              </h1>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Danh sách các đơn vị đào tạo an toàn lao động được xác nhận và đánh giá cao
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-white/80">
                <i className="fas fa-check-circle"></i>
                <span>{partners.length} đối tác đã được xác nhận</span>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="py-8 bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên doanh nghiệp, mã số thuế..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Specialization Filter */}
              <div className="md:w-64">
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">Tất cả lĩnh vực</option>
                  {allSpecializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600">
              Hiển thị{' '}
              <span className="font-semibold text-neutral-dark">{filteredPartners.length}</span> kết
              quả
              {searchTerm && ` cho "${searchTerm}"`}
              {selectedSpecialization !== 'all' && ` trong lĩnh vực "${selectedSpecialization}"`}
            </div>
          </div>
        </section>

        {/* Partners Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {filteredPartners.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPartners.map((partner) => (
                  <TrustedPartnerCard
                    key={partner.id}
                    partner={partner}
                    onClick={() => setSelectedPartner(partner)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl shadow-md">
                <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-600 text-lg">
                  Không tìm thấy đối tác phù hợp với tiêu chí tìm kiếm
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSpecialization('all');
                  }}
                  className="mt-4 text-primary hover:text-orange-600 font-semibold"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-br from-blue-50 to-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-neutral-dark mb-4">
              Bạn cần tư vấn đào tạo an toàn lao động?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Liên hệ với chúng tôi để được tư vấn và kết nối với đơn vị đào tạo phù hợp nhất
            </p>
            <button
              onClick={() => navigate('/#create-request-form')}
              className="bg-gradient-to-r from-primary to-orange-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <i className="fas fa-paper-plane mr-2"></i>
              Gửi yêu cầu đào tạo
            </button>
          </div>
        </section>
      </div>

      {/* Partner Info Modal */}
      {selectedPartner && (
        <TrustedPartnerInfoModal
          partner={selectedPartner}
          onClose={() => setSelectedPartner(null)}
          onViewAllPartners={() => {
            setSelectedPartner(null);
            cuonLenDau();
          }}
        />
      )}
    </>
  );
};

export default AllPartnersPage;
