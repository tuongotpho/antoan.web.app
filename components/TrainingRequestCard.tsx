import React, { useState, useRef } from 'react';
import { db, doc, updateDoc, arrayUnion, type User } from '../services/firebaseConfig';
import { TrainingRequest } from '../types';
import { PartnerStatus } from '../App';
// html2canvas-pro KHÔNG khai báo ở đây: nó được nạp ngay lúc bấm nút chụp ảnh
// (xem handleExportImage). Để ở đây thì mọi người mở trang đều tải 258 KB dù
// hầu như không ai dùng tới.
import QuoteForm from './QuoteForm';

interface TrainingRequestCardProps {
  request: TrainingRequest;
  user?: User | null;
  onLoginRequired?: () => void;
  isAdminView?: boolean;
  onDeleteRequest?: (id: string) => void;
  onShowViewers?: (request: TrainingRequest) => void;
  partnerStatus?: PartnerStatus;
  onChatClick?: (request: TrainingRequest) => void;
}

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className || 'h-5 w-5 mr-2 inline'}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
);

const TrainingRequestCard: React.FC<TrainingRequestCardProps> = ({
  request,
  user,
  onLoginRequired,
  isAdminView = false,
  onDeleteRequest,
  onShowViewers,
  partnerStatus,
  onChatClick,
}) => {
  const [showContact, setShowContact] = useState(isAdminView);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const hasUnlocked = user && request.viewedBy.includes(user.uid);
  const totalParticipants =
    request.trainingDetails?.reduce((sum, detail) => sum + detail.participants, 0) || 0;

  const handleUnlockContact = async () => {
    if (!user) {
      onLoginRequired?.();
      return;
    }
    if (user && partnerStatus && partnerStatus !== 'approved') {
      alert('Tài khoản của bạn cần được quản trị viên phê duyệt để sử dụng tính năng này.');
      return;
    }
    if (hasUnlocked) {
      setShowContact(true);
      return;
    }
    setIsUnlocking(true);
    try {
      const requestRef = doc(db, 'trainingRequests', request.id);
      await updateDoc(requestRef, {
        viewedBy: arrayUnion(user.uid),
      });
      setShowContact(true);
    } catch (error) {
      console.error('Error unlocking contact: ', error);
      alert('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' năm trước';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' tháng trước';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' ngày trước';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' giờ trước';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' phút trước';
    return 'Vừa xong';
  };

  const handleDeleteClick = () => {
    if (onDeleteRequest) {
      onDeleteRequest(request.id);
    }
  };

  const handleExportImage = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      // Nạp thư viện chụp ảnh NGAY LÚC BẤM, không nạp sẵn từ đầu.
      //
      // Trước đây nó được khai báo ở đầu file, nên mọi người mở trang danh sách
      // yêu cầu đều phải tải về 258 KB (66 KB sau khi nén) — kể cả tuyệt đại đa
      // số không bao giờ bấm nút chụp ảnh. Đây là mảnh mã nặng nhất của cả
      // trang, nặng gấp nhiều lần chính trang danh sách.
      const { default: html2canvas } = await import('html2canvas-pro');

      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: '#ffffff', // Explicitly set a white background
        // Remove the export button from the capture
        ignoreElements: (element) => element.classList.contains('export-button'),
      });
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `yeu-cau-${request.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Đã xảy ra lỗi khi xuất ảnh.');
    } finally {
      setIsExporting(false);
    }
  };

  const firstTrainingType = request.trainingDetails?.[0]?.type || 'Yêu cầu Huấn luyện';
  const otherTypesCount =
    (request.trainingDetails?.length || 0) > 1 ? ` (+${request.trainingDetails.length - 1})` : '';
  const cardTitle = `${firstTrainingType}${otherTypesCount}`;

  return (
    <div
      ref={cardRef}
      className="bg-white border border-gray-200 rounded-lg p-4 transition-shadow hover:shadow-xl flex flex-col h-full"
    >
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-grow">
            <h3
              className="text-lg font-bold text-neutral-dark leading-tight pr-2"
              title={cardTitle}
            >
              {cardTitle}
            </h3>
            {request.urgent && (
              <span className="mt-1.5 inline-block bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                <i className="fas fa-exclamation-circle mr-1"></i> KHẨN CẤP
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            <span className="text-xs text-gray-500">
              {request.createdAt ? timeSince(request.createdAt.toDate()) : 'Vừa xong'}
            </span>
            <button
              onClick={handleExportImage}
              disabled={isExporting}
              className="export-button p-2 h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-wait"
              aria-label="Xuất ảnh thẻ yêu cầu"
              title="Xuất ảnh"
            >
              {isExporting ? (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <i className="fas fa-camera"></i>
              )}
            </button>
          </div>
        </div>

        {isAdminView && (
          <button
            onClick={() => onShowViewers?.(request)}
            disabled={!request.viewedBy || request.viewedBy.length === 0}
            className="mb-2 text-sm text-accent font-bold flex items-center cursor-pointer disabled:cursor-not-allowed disabled:text-gray-400 hover:underline"
            aria-label="Xem danh sách người đã xem"
          >
            <i className="fas fa-eye mr-1"></i>
            <span>{request.viewedBy?.length || 0} lượt xem</span>
          </button>
        )}

        <div className="text-sm text-gray-700 space-y-1.5 mt-3 border-t pt-3">
          <p>
            <strong>
              <i className="fas fa-map-marker-alt w-5 text-center mr-1 text-gray-400"></i>Địa điểm:
            </strong>{' '}
            {request.location}
          </p>
          <p>
            <strong>
              <i className="fas fa-clock w-5 text-center mr-1 text-gray-400"></i>Thời gian:
            </strong>{' '}
            {request.trainingDuration}
          </p>
          <p>
            <strong>
              <i className="fas fa-calendar-alt w-5 text-center mr-1 text-gray-400"></i>Thời điểm:
            </strong>{' '}
            {request.preferredTime}
          </p>
          <p>
            <strong>
              <i className="fas fa-users w-5 text-center mr-1 text-gray-400"></i>Tổng số:
            </strong>{' '}
            {totalParticipants} học viên
          </p>
        </div>

        <div className="border-t mt-3 pt-3 text-sm text-gray-600">
          <h4 className="font-semibold text-neutral-dark mb-2">Nội dung chi tiết:</h4>
          <ul className="list-disc list-inside space-y-1">
            {request.trainingDetails?.map((detail, index) => (
              <li key={index}>
                {detail.type}: <strong>{detail.participants} học viên</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-shrink-0 mt-4">
        {showContact || hasUnlocked ? (
          <>
            <div className="bg-green-100 border border-green-200 p-3 rounded-lg text-sm text-neutral-dark space-y-1">
              <h4 className="font-bold text-green-800 mb-1 flex items-center">
                <InfoIcon className="h-5 w-5 mr-1 inline" />
                Thông Tin Liên Hệ
              </h4>
              <p>
                <strong>Tên:</strong> {request.clientName}
              </p>
              <p>
                <strong>Email:</strong>{' '}
                <a href={`mailto:${request.clientEmail}`} className="text-accent hover:underline">
                  {request.clientEmail}
                </a>
              </p>
              <p>
                <strong>SĐT:</strong>{' '}
                <a href={`tel:${request.clientPhone}`} className="text-accent hover:underline">
                  {request.clientPhone}
                </a>
              </p>
            </div>
            {!isAdminView && user && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setShowQuoteForm(true)}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-2.5 rounded-lg hover:opacity-90 transition-all text-base flex items-center justify-center"
                >
                  <i className="fas fa-paper-plane mr-2"></i>
                  Gửi Báo Giá
                </button>
                <button
                  onClick={() => onChatClick?.(request)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-2.5 rounded-lg hover:opacity-90 transition-all text-base flex items-center justify-center"
                >
                  <i className="fas fa-comments mr-2"></i>
                  Chat với Admin
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            onClick={handleUnlockContact}
            disabled={isUnlocking || (user && partnerStatus === 'pending')}
            className="w-full flex justify-center items-center bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary-dark transition duration-300 disabled:bg-primary-dark disabled:opacity-75 disabled:cursor-wait text-base"
          >
            {isUnlocking ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Đang xử lý...</span>
              </>
            ) : user && partnerStatus === 'pending' ? (
              'Tài khoản chờ duyệt'
            ) : (
              'Xem thông tin & Báo giá'
            )}
          </button>
        )}
        {isAdminView && onDeleteRequest && (
          <button
            onClick={handleDeleteClick}
            className="w-full mt-2 bg-red-600 text-white font-bold py-2.5 rounded-lg hover:bg-red-700 transition duration-300 text-base"
          >
            <i className="fas fa-trash-alt mr-2"></i>Xóa Yêu Cầu
          </button>
        )}
      </div>

      {/* Quote Form Modal */}
      {showQuoteForm && user && (
        <QuoteForm
          request={request}
          partnerUid={user.uid}
          partnerEmail={user.email || ''}
          onClose={() => setShowQuoteForm(false)}
          onSuccess={() => {
            setShowQuoteForm(false);
          }}
        />
      )}
    </div>
  );
};

export default TrainingRequestCard;
