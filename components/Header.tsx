import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, signOut, type User } from '../services/firebaseConfig';
import { cuonToiId } from '../utils/cuonTrang';
import { PartnerStatus } from '../App';

interface HeaderProps {
  user: User | null;
  isAdmin: boolean;
  onLoginClick: () => void;
  currentPage: string;
  partnerStatus: PartnerStatus;
  unreadCount?: number;
}

const NavLink: React.FC<{
  to: string;
  currentPage: string;
  children: React.ReactNode;
  mobile?: boolean;
  onClick?: () => void;
}> = ({ to, currentPage, children, mobile = false, onClick }) => {
  // Determine if this link is active
  const getPageFromPath = (path: string): string => {
    if (path === '/') return 'home';
    return path.slice(1); // remove leading slash
  };

  const isActive = currentPage === getPageFromPath(to);

  const classes = mobile
    ? `block w-full text-left px-4 py-3 text-base font-medium transition-colors duration-300 ${
        isActive
          ? 'text-primary bg-orange-50'
          : 'text-neutral-dark hover:text-primary hover:bg-gray-50'
      }`
    : `cursor-pointer px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
        isActive ? 'text-primary' : 'text-neutral-dark hover:text-primary'
      }`;

  return (
    <Link to={to} onClick={onClick} className={classes}>
      {children}
    </Link>
  );
};

const Header: React.FC<HeaderProps> = ({
  user,
  isAdmin,
  onLoginClick,
  currentPage,
  partnerStatus,
  unreadCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/'); // Redirect to home on logout
    } catch (error) {
      console.error('Error signing out: ', error);
      alert('Đã xảy ra lỗi khi đăng xuất.');
    }
  };

  const handleCreateRequestClick = () => {
    if (currentPage === 'home') {
      cuonToiId('create-request-form');
      return;
    }

    navigate('/');

    // Chờ cho tới khi form thật sự có mặt rồi mới cuộn.
    //
    // TRƯỚC ĐÂY dùng setTimeout(cuonToiForm, 100). Mã trang chủ được nạp theo
    // kiểu chia nhỏ, nên lần đầu vào phải tải mảnh mã từ mạng — thường lâu hơn
    // 100ms nhiều, nhất là trên 3G ở công trường. Hết 100ms mà form chưa dựng
    // xong thì lệnh cuộn rơi vào hư không: người dùng về tới trang chủ nhưng
    // vẫn ở trên đầu trang, phải tự mò xuống tìm form.
    //
    // Đây lại là nút kêu gọi hành động chính của cả website.
    const HET_HAN = 5000;
    const NHIP = 100;
    const batDau = Date.now();

    const thu = () => {
      if (cuonToiId('create-request-form')) return;
      if (Date.now() - batDau < HET_HAN) {
        setTimeout(thu, NHIP);
      }
      // Quá hạn thì thôi, không cuộn — vẫn hơn là nhảy lung tung.
    };

    setTimeout(thu, NHIP);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary cursor-pointer">
            SafetyConnect
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <NavLink to="/" currentPage={currentPage}>
              Trang Chủ
            </NavLink>
            <NavLink to="/requests" currentPage={currentPage}>
              Danh Sách Yêu Cầu
            </NavLink>
            <NavLink to="/blog" currentPage={currentPage}>
              <i className="fas fa-newspaper mr-1"></i>Blog
            </NavLink>
            {user && (
              <NavLink to="/chat" currentPage={currentPage}>
                <span className="relative inline-flex items-center">
                  <i className="fas fa-comments mr-1"></i>Tin nhắn
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              </NavLink>
            )}
            <NavLink to="/documents" currentPage={currentPage}>
              Tài Liệu
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" currentPage={currentPage}>
                <span className="font-bold text-red-600">
                  <i className="fas fa-user-shield mr-1"></i> Quản Trị
                </span>
              </NavLink>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2 md:space-x-4">
            {!user && (
              <button
                onClick={handleCreateRequestClick}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition duration-300 text-sm font-medium"
              >
                Tạo Yêu Cầu
              </button>
            )}
            {user ? (
              <>
                {partnerStatus === 'pending' && (
                  <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Chờ phê duyệt
                  </span>
                )}
                <span className="text-neutral-dark text-sm hidden lg:block">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300 text-sm font-medium"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <button
                onClick={onLoginClick}
                className="bg-accent text-white px-4 py-2 rounded-lg hover:opacity-90 transition duration-300 text-sm font-medium"
              >
                Đăng nhập / Đăng ký
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen((truoc) => !truoc)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-300"
            // Nhãn cũ là "Toggle menu" — tiếng Anh giữa một trang tiếng Việt,
            // và không cho biết bấm vào sẽ mở hay đóng.
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg
                className="w-6 h-6 text-neutral-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-neutral-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu Drawer */}
      {/* Lúc đóng, ngăn kéo này KHÔNG biến mất khỏi trang — nó chỉ bị đẩy ra
          ngoài mép phải để còn trượt vào cho mượt. Hệ quả đã đo được: cả 7 mục
          bên trong vẫn bấm Tab tới được, nên người dùng bàn phím đang đi giữa
          trang thì con trỏ bỗng rơi vào một menu vô hình ngoài màn hình, bấm
          Tab tiếp mấy lần mới thoát ra.
          `inert` khoá cả chuột lẫn bàn phím lẫn trình đọc màn hình khi đóng. */}
      <div
        inert={!mobileMenuOpen}
        aria-hidden={!mobileMenuOpen}
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex justify-between items-center px-4 py-4 border-b border-gray-200">
            <span className="text-xl font-bold text-primary">Menu</span>
            <button
              onClick={closeMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6 text-neutral-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* User Info Section */}
          {user && (
            <div className="px-4 py-4 bg-gradient-to-r from-orange-50 to-blue-50 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-dark truncate">{user.email}</p>
                  {partnerStatus === 'pending' && (
                    <span className="inline-block text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full mt-1">
                      Chờ phê duyệt
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <NavLink to="/" currentPage={currentPage} mobile onClick={closeMobileMenu}>
              <i className="fas fa-home mr-3"></i>Trang Chủ
            </NavLink>
            <NavLink to="/requests" currentPage={currentPage} mobile onClick={closeMobileMenu}>
              <i className="fas fa-list mr-3"></i>Danh Sách Yêu Cầu
            </NavLink>
            <NavLink to="/blog" currentPage={currentPage} mobile onClick={closeMobileMenu}>
              <i className="fas fa-newspaper mr-3"></i>Blog
            </NavLink>
            {user && (
              <NavLink to="/chat" currentPage={currentPage} mobile onClick={closeMobileMenu}>
                <span className="relative inline-flex items-center w-full">
                  <i className="fas fa-comments mr-3"></i>Tin nhắn
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              </NavLink>
            )}
            <NavLink to="/documents" currentPage={currentPage} mobile onClick={closeMobileMenu}>
              <i className="fas fa-file-alt mr-3"></i>Tài Liệu
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" currentPage={currentPage} mobile onClick={closeMobileMenu}>
                <i className="fas fa-user-shield mr-3 text-red-600"></i>
                <span className="font-bold text-red-600">Quản Trị</span>
              </NavLink>
            )}
          </nav>

          {/* Action Buttons */}
          <div className="px-4 py-4 border-t border-gray-200 space-y-3">
            {!user && (
              <>
                <button
                  onClick={() => {
                    handleCreateRequestClick();
                    closeMobileMenu();
                  }}
                  className="w-full bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary-dark transition duration-300 text-sm font-medium flex items-center justify-center"
                >
                  <i className="fas fa-plus-circle mr-2"></i>
                  Tạo Yêu Cầu
                </button>
                <button
                  onClick={() => {
                    onLoginClick();
                    closeMobileMenu();
                  }}
                  className="w-full bg-accent text-white px-4 py-3 rounded-lg hover:opacity-90 transition duration-300 text-sm font-medium flex items-center justify-center"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Đăng nhập / Đăng ký
                </button>
              </>
            )}
            {user && (
              <button
                onClick={() => {
                  handleLogout();
                  closeMobileMenu();
                }}
                className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition duration-300 text-sm font-medium flex items-center justify-center"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Đăng xuất
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
