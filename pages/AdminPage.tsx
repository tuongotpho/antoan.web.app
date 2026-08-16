import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { useAdminData } from '../hooks/useAdminData';
import { useAdminActions } from '../hooks/useAdminActions';
import DashboardTab from '../components/admin/DashboardTab';
import SeoTab from '../components/admin/SeoTab';
import BlogManagement from '../components/BlogManagement';

type AdminTab = 'dashboard' | 'blog' | 'seo';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const { user, isAdmin, loadingAuth, onLoginRequired } = useContext(AppContext);

  const { partners, requests, loading, loadError } = useAdminData();
  const {
    actionError,
    setActionError,
    handleUpdatePartnerStatus,
    handleDeletePartner,
    handleDeleteRequest,
    handleUpdatePartner,
  } = useAdminActions();

  // TRƯỚC ĐÂY ở đây có một biến currentUser riêng, lấy bằng:
  //
  //     useEffect(() => { setCurrentUser(auth.currentUser); }, []);
  //
  // Firebase khôi phục phiên đăng nhập BẤT ĐỒNG BỘ: lúc trang vừa dựng,
  // auth.currentUser thường vẫn rỗng, vài trăm mili giây sau mới có giá trị.
  // Đoạn trên chỉ đọc đúng một lần rồi thôi, không bao giờ đọc lại — nên
  // currentUser kẹt ở rỗng, và điều kiện hiển thị tab Blog không bao giờ đúng:
  // bấm vào "Quản lý Blog" thì trang trắng, không tạo bài viết được.
  //
  // Lỗi lúc được lúc không: vào từ trang khác thì auth có thể đã kịp sẵn sàng,
  // còn tải thẳng /admin thì hỏng — kiểu lỗi khó lần ra nhất.
  //
  // Nay dùng chung `user` của AppContext, vốn được cập nhật đúng qua
  // onAuthStateChanged mỗi khi trạng thái đăng nhập đổi.

  // Trang này TRƯỚC ĐÂY không kiểm quyền: ai gõ /admin cũng vào được và nhận
  // câu lỗi kỹ thuật tiếng Anh "Missing or insufficient permissions".
  // Dữ liệu không hề lộ — firestore.rules chặn đúng — nhưng người dùng không
  // hiểu chuyện gì đang xảy ra, và toàn bộ khung quản trị vẫn phơi ra.
  if (loadingAuth) {
    return <div className="text-center p-10">Đang kiểm tra quyền truy cập...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
            <i className="fas fa-lock text-2xl text-primary"></i>
          </div>
          <h1 className="text-xl font-bold text-neutral-dark mb-3">Khu vực quản trị</h1>
          <p className="text-gray-600 mb-6">Anh/chị cần đăng nhập bằng tài khoản quản trị.</p>
          <button
            onClick={onLoginRequired}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-lg hover:bg-primary-dark transition-all inline-flex items-center gap-2"
          >
            <i className="fas fa-right-to-bracket"></i>
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center">
            <i className="fas fa-ban text-2xl text-red-500"></i>
          </div>
          <h1 className="text-xl font-bold text-neutral-dark mb-3">Không có quyền truy cập</h1>
          <p className="text-gray-600">
            Tài khoản này không phải quản trị viên. Nếu cần quyền quản trị, vui lòng liên hệ người
            phụ trách hệ thống.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-center p-10">Đang tải dữ liệu...</div>;
  if (loadError) return <div className="text-center p-10 text-red-500">{loadError}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-dark mb-2">
          <i className="fas fa-tachometer-alt mr-3"></i>Bảng điều khiển Quản trị
        </h1>
        <p className="text-gray-600">Tổng quan tình hình hoạt động của hệ thống.</p>
      </div>

      {/* Tabs */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-semibold transition-all ${activeTab === 'dashboard'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            <i className="fas fa-tachometer-alt mr-2"></i>
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('blog')}
            className={`px-6 py-3 font-semibold transition-all ${activeTab === 'blog'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            <i className="fas fa-newspaper mr-2"></i>
            Quản lý Blog
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`px-6 py-3 font-semibold transition-all ${activeTab === 'seo'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            <i className="fas fa-search mr-2"></i>
            SEO Tools
          </button>
        </nav>
      </div>

      {actionError && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-md mb-8 relative"
          role="alert"
        >
          <strong className="font-bold">Đã xảy ra lỗi!</strong>
          <p className="block sm:inline mt-1 whitespace-pre-wrap">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            aria-label="Đóng"
          >
            <span className="text-2xl font-bold">&times;</span>
          </button>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <DashboardTab
          partners={partners}
          requests={requests}
          onUpdatePartnerStatus={handleUpdatePartnerStatus}
          onDeletePartner={handleDeletePartner}
          onDeleteRequest={handleDeleteRequest}
          onUpdatePartner={handleUpdatePartner}
        />
      )}

      {/* Blog Management Tab */}
      {activeTab === 'blog' && user && <BlogManagement user={user} />}

      {/* SEO Tools Tab */}
      {activeTab === 'seo' && <SeoTab />}
    </div>
  );
};

export default AdminPage;
