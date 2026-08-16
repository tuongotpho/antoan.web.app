import React, { useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrainingRequest } from '../types';
import TrainingRequestList from '../components/TrainingRequestList';
import AdvancedSearchFilter, { FilterState } from '../components/AdvancedSearchFilter';
import SEOHead from '../components/SEOHead';
import { AppContext } from '../App';
import { getOrCreateAdminPartnerChatRoom } from '../utils/chatHelpers';

const RequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    partnerStatus,
    trainingRequests: requests,
    loadingRequests: loading,
    onLoginRequired,
  } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    trainingTypes: [],
    provinces: [],
    participantsMin: 0,
    participantsMax: 1000,
    urgent: false,
    dateFrom: '',
    dateTo: '',
  });

  const showPendingBanner = user && partnerStatus === 'pending';
  const showRejectedBanner = user && partnerStatus === 'rejected';

  // Helper function to parse varied date strings like "T11/2024", "Tháng 12 2024"
  const parsePreferredTime = (timeStr: string): Date | null => {
    if (!timeStr) return null;
    const match = timeStr.match(/(?:T|Tháng)?\s*(\d{1,2})[/\s.,-]+(\d{4})/);
    if (match) {
      const month = parseInt(match[1], 10);
      const year = parseInt(match[2], 10);
      if (month >= 1 && month <= 12) {
        // Set to the first day of the month for consistent sorting
        return new Date(year, month - 1, 1);
      }
    }
    return null;
  };

  // Helper to parse month from preferredTime like "T11/2024" or "Tháng 12 2024"
  const parseMonth = (timeStr: string): { month: number; year: number } | null => {
    if (!timeStr) return null;
    const match = timeStr.match(/(?:T|Tháng)?\s*(\d{1,2})[/\s.,-]+(\d{4})/);
    if (match) {
      const month = parseInt(match[1], 10);
      const year = parseInt(match[2], 10);
      if (month >= 1 && month <= 12) {
        return { month, year };
      }
    }
    return null;
  };

  const filteredAndSortedRequests = useMemo(() => {
    let processedRequests = [...requests];

    // 1. Filtering by search query
    if (searchQuery.trim()) {
      const lowercasedQuery = searchQuery.toLowerCase();
      processedRequests = processedRequests.filter((req) => {
        const locationMatch = req.location.toLowerCase().includes(lowercasedQuery);
        const descriptionMatch = req.description.toLowerCase().includes(lowercasedQuery);
        const typesMatch =
          req.trainingDetails?.some((detail) =>
            detail.type.toLowerCase().includes(lowercasedQuery)
          ) || false;
        return locationMatch || descriptionMatch || typesMatch;
      });
    }

    // 2. Advanced Filters
    // Filter by training types
    if (advancedFilters.trainingTypes.length > 0) {
      processedRequests = processedRequests.filter((req) =>
        req.trainingDetails?.some((detail) => advancedFilters.trainingTypes.includes(detail.type))
      );
    }

    // Filter by provinces
    if (advancedFilters.provinces.length > 0) {
      processedRequests = processedRequests.filter((req) =>
        advancedFilters.provinces.some((province) => req.location.includes(province))
      );
    }

    // Filter by participants count
    processedRequests = processedRequests.filter((req) => {
      const totalParticipants =
        req.trainingDetails?.reduce((sum, d) => sum + d.participants, 0) || 0;
      return (
        totalParticipants >= advancedFilters.participantsMin &&
        totalParticipants <= advancedFilters.participantsMax
      );
    });

    // Filter by urgent status
    if (advancedFilters.urgent) {
      processedRequests = processedRequests.filter((req) => req.urgent === true);
    }

    // Filter by date range
    if (advancedFilters.dateFrom || advancedFilters.dateTo) {
      processedRequests = processedRequests.filter((req) => {
        const reqDate = parseMonth(req.preferredTime);
        if (!reqDate) return false;

        // Convert to comparable format YYYYMM
        const reqYYYYMM = reqDate.year * 100 + reqDate.month;

        let matches = true;

        if (advancedFilters.dateFrom) {
          const [fromYear, fromMonth] = advancedFilters.dateFrom.split('-').map(Number);
          const fromYYYYMM = fromYear * 100 + fromMonth;
          matches = matches && reqYYYYMM >= fromYYYYMM;
        }

        if (advancedFilters.dateTo) {
          const [toYear, toMonth] = advancedFilters.dateTo.split('-').map(Number);
          const toYYYYMM = toYear * 100 + toMonth;
          matches = matches && reqYYYYMM <= toYYYYMM;
        }

        return matches;
      });
    }

    // 3. Sorting
    switch (sortBy) {
      case 'participants':
        processedRequests.sort((a, b) => {
          const totalA = a.trainingDetails?.reduce((sum, d) => sum + d.participants, 0) || 0;
          const totalB = b.trainingDetails?.reduce((sum, d) => sum + d.participants, 0) || 0;
          return totalB - totalA;
        });
        break;
      case 'soonest':
        processedRequests.sort((a, b) => {
          const dateA = parsePreferredTime(a.preferredTime);
          const dateB = parsePreferredTime(b.preferredTime);

          if (dateA && dateB) return dateA.getTime() - dateB.getTime();
          if (dateA) return -1; // dateA is valid, comes first
          if (dateB) return 1; // dateB is valid, comes first
          return 0; // both are invalid/null
        });
        break;
      case 'newest':
      default:
        // The default list from Firebase is already sorted by newest
        // No extra sorting needed unless it was changed
        processedRequests.sort(
          (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
        );
        break;
    }

    return processedRequests;
  }, [requests, searchQuery, sortBy, advancedFilters]);

  const handleFilterChange = (newFilters: FilterState) => {
    setAdvancedFilters(newFilters);
  };

  const handleClearFilters = () => {
    setAdvancedFilters({
      trainingTypes: [],
      provinces: [],
      participantsMin: 0,
      participantsMax: 1000,
      urgent: false,
      dateFrom: '',
      dateTo: '',
    });
  };

  const handleChatClick = async (request: TrainingRequest) => {
    if (!user) {
      onLoginRequired();
      return;
    }

    try {
      // Tạo hoặc lấy phòng chat với admin
      await getOrCreateAdminPartnerChatRoom(
        request,
        user.uid,
        user.displayName || user.email || 'Partner',
        user.email || ''
      );

      // Navigate to chat page
      navigate('/chat');
    } catch (error) {
      console.error('Error creating chat room:', error);
      alert('Không thể tạo phòng chat. Vui lòng thử lại.');
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Trang này nằm trong sitemap nhưng trước đây không có thẻ SEO riêng, nên
          Google thấy tiêu đề và mô tả trùng hệt trang chủ. */}
      <SEOHead
        title="Yêu Cầu Huấn Luyện An Toàn Lao Động | SafetyConnect"
        description="Danh sách nhu cầu huấn luyện an toàn lao động từ các doanh nghiệp trên toàn quốc. Đơn vị đào tạo đăng ký để xem chi tiết và gửi báo giá."
        url="https://antoan.web.app/requests"
        keywords={[
          'yêu cầu huấn luyện an toàn lao động',
          'tìm khách hàng đào tạo an toàn',
          'báo giá huấn luyện an toàn lao động',
        ]}
      />
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-dark mb-2">
          Danh Sách Yêu Cầu Huấn Luyện
        </h1>
        <p className="text-gray-600">
          Tất cả các nhu cầu huấn luyện mới nhất được cập nhật tại đây.
        </p>
      </div>

      {/* Khách chưa đăng nhập không đọc được collection trainingRequests (rules
          chặn để đối thủ không hút được danh sách khách hàng). Trước đây App.tsx
          gán danh sách rỗng và trang này hiện "Chưa có yêu cầu nào được tạo" —
          báo sai sự thật, khiến đơn vị đào tạo tưởng sàn trống rồi bỏ đi. */}
      {!user ? (
        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
            <i className="fas fa-lock text-2xl text-primary"></i>
          </div>
          <h2 className="text-xl font-bold text-neutral-dark mb-3">
            Đăng nhập để xem các yêu cầu đang chờ báo giá
          </h2>
          <p className="text-gray-600 mb-6">
            Thông tin liên hệ của doanh nghiệp chỉ hiển thị cho các đơn vị đào tạo đã đăng ký. Đăng
            nhập hoặc đăng ký làm đối tác để xem danh sách và gửi báo giá.
          </p>
          <button
            onClick={onLoginRequired}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-lg hover:bg-primary-dark transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2"
          >
            <i className="fas fa-right-to-bracket"></i>
            Đăng nhập / Đăng ký
          </button>
        </div>
      ) : (
        <>
      {/* Advanced Search Filter */}
      <AdvancedSearchFilter onFilterChange={handleFilterChange} onClear={handleClearFilters} />

      {/* Filter and Sort Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <i className="fas fa-search text-gray-400"></i>
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm theo từ khóa, địa điểm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
            aria-label="Tìm kiếm yêu cầu"
          />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">
            Sắp xếp:
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg py-2.5 pl-3 pr-8 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition bg-white text-neutral-dark"
            aria-label="Sắp xếp yêu cầu"
          >
            <option value="newest">Mới nhất</option>
            <option value="participants">Nhiều học viên nhất</option>
            <option value="soonest">Sắp diễn ra</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Hiển thị{' '}
        <span className="font-semibold text-primary">{filteredAndSortedRequests.length}</span> yêu
        cầu
        {filteredAndSortedRequests.length !== requests.length && (
          <span>
            {' '}
            từ tổng số <span className="font-semibold">{requests.length}</span>
          </span>
        )}
      </div>

      {showPendingBanner && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md mb-8"
          role="alert"
        >
          <p className="font-bold">Tài khoản đang chờ phê duyệt</p>
          <p>
            Bạn có thể xem danh sách các yêu cầu, nhưng cần được phê duyệt để xem thông tin liên hệ
            chi tiết và báo giá.
          </p>
        </div>
      )}

      {showRejectedBanner && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-8"
          role="alert"
        >
          <p className="font-bold">Hồ sơ chưa được duyệt</p>
          <p>
            Rất tiếc, hồ sơ của bạn chưa được phê duyệt. Vui lòng liên hệ quản trị viên để biết thêm
            chi tiết.
          </p>
        </div>
      )}

      <TrainingRequestList
        requests={filteredAndSortedRequests}
        user={user}
        loading={loading}
        onLoginRequired={onLoginRequired}
        partnerStatus={partnerStatus}
        searchQuery={searchQuery}
        onChatClick={handleChatClick}
      />
        </>
      )}
    </div>
  );
};

export default RequestsPage;
