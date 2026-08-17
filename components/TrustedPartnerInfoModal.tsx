import React from 'react';
import { TrustedPartner } from '../types';
import {
  validateAndFormatUrl,
  formatPhoneForTel,
  formatPhoneForDisplay,
} from '../utils/validationHelpers';
import { useDongBangEsc } from '../hooks/useDongBangEsc';
import { useKhoaConTroTrongHop } from '../hooks/useKhoaConTroTrongHop';

interface TrustedPartnerInfoModalProps {
  partner: TrustedPartner;
  onClose: () => void;
  onViewAllPartners: () => void;
}

const TrustedPartnerInfoModal: React.FC<TrustedPartnerInfoModalProps> = ({
  partner,
  onClose,
  onViewAllPartners,
}) => {
  // Bấm Esc để đóng.
  useDongBangEsc(true, onClose);
  const hopRef = useKhoaConTroTrongHop(true);

  const websiteUrl = validateAndFormatUrl(partner.website);
  const phoneForTel = formatPhoneForTel(partner.phone);
  const phoneDisplay = formatPhoneForDisplay(partner.phone);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* role="dialog" chỉ đặt Ở ĐÂY, trên đúng hộp nội dung. Trước đây cả lớp
          nền mờ bên ngoài cũng mang role="dialog", mà lớp nền lại bọc hộp bên
          trong — trình đọc màn hình gặp hai hộp thoại lồng nhau. */}
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
        ref={hopRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-orange-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 id="partner-modal-title" className="text-2xl font-bold">
                  {partner.businessName}
                </h2>
                {partner.verified && (
                  <div
                    className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5"
                    aria-label="Đối tác đã được xác nhận"
                  >
                    <i className="fas fa-check-circle text-sm" aria-hidden="true"></i>
                    <span className="text-xs font-semibold">Đã xác nhận</span>
                  </div>
                )}
              </div>
              <p className="text-white/90 text-sm">{partner.description}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              aria-label="Đóng hộp thoại"
              type="button"
            >
              <i className="fas fa-times text-xl" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Logo (if available) */}
          {partner.logo && (
            <div className="flex justify-center">
              <img
                src={partner.logo}
                alt={partner.businessName}
                className="max-h-32 rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            <h3 className="font-bold text-lg text-neutral-dark mb-3 flex items-center gap-2">
              <i className="fas fa-info-circle text-primary" aria-hidden="true"></i>
              Thông tin cơ bản
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <i className="fas fa-id-card w-5 text-gray-400 mt-1" aria-hidden="true"></i>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Mã số thuế</p>
                  <p className="font-mono font-semibold text-neutral-dark">{partner.taxId}</p>
                </div>
              </div>

              {websiteUrl && (
                <div className="flex items-start gap-3">
                  <i className="fas fa-globe w-5 text-gray-400 mt-1" aria-hidden="true"></i>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Website</p>
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium break-all"
                      aria-label={`Truy cập website ${partner.businessName}`}
                    >
                      {partner.website}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <i className="fas fa-map-marker-alt w-5 text-gray-400 mt-1" aria-hidden="true"></i>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Địa chỉ</p>
                  <p className="text-neutral-dark">{partner.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <i className="fas fa-phone w-5 text-gray-400 mt-1" aria-hidden="true"></i>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Số điện thoại</p>
                  <a
                    href={`tel:${phoneForTel}`}
                    className="text-neutral-dark hover:text-primary font-medium"
                    aria-label={`Gọi điện thoại ${phoneDisplay}`}
                  >
                    {phoneDisplay}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <i className="fas fa-envelope w-5 text-gray-400 mt-1" aria-hidden="true"></i>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <a
                    href={`mailto:${partner.email}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                    aria-label={`Gửi email đến ${partner.email}`}
                  >
                    {partner.email}
                  </a>
                </div>
              </div>

              {partner.establishedYear && (
                <div className="flex items-start gap-3">
                  <i className="fas fa-calendar-alt w-5 text-gray-400 mt-1" aria-hidden="true"></i>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Năm thành lập</p>
                    <p className="text-neutral-dark font-semibold">{partner.establishedYear}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Specializations */}
          {partner.specializations && partner.specializations.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-5">
              <h3 className="font-bold text-lg text-neutral-dark mb-3 flex items-center gap-2">
                <i className="fas fa-certificate text-blue-600" aria-hidden="true"></i>
                Lĩnh vực chuyên môn
              </h3>
              <div className="flex flex-wrap gap-2">
                {partner.specializations.map((spec, index) => (
                  <span
                    key={index}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {partner.certifications && partner.certifications.length > 0 && (
            <div className="bg-green-50 rounded-xl p-5">
              <h3 className="font-bold text-lg text-neutral-dark mb-3 flex items-center gap-2">
                <i className="fas fa-award text-green-600" aria-hidden="true"></i>
                Chứng chỉ & Giấy phép
              </h3>
              <ul className="space-y-2">
                {partner.certifications.map((cert, index) => (
                  <li key={index} className="flex items-start gap-2 text-neutral-dark">
                    <i className="fas fa-check-circle text-green-600 mt-1" aria-hidden="true"></i>
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notable Clients */}
          {partner.notableClients && partner.notableClients.length > 0 && (
            <div className="bg-purple-50 rounded-xl p-5">
              <h3 className="font-bold text-lg text-neutral-dark mb-3 flex items-center gap-2">
                <i className="fas fa-star text-purple-600" aria-hidden="true"></i>
                Khách hàng tiêu biểu
              </h3>
              <div className="flex flex-wrap gap-2">
                {partner.notableClients.map((client, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg text-sm font-medium border border-purple-200"
                  >
                    {client}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={onViewAllPartners}
              className="flex-1 bg-gradient-to-r from-primary to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              type="button"
              aria-label="Xem danh sách tất cả đối tác"
            >
              <i className="fas fa-list" aria-hidden="true"></i>
              <span>Xem tất cả đối tác</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              type="button"
              aria-label="Đóng hộp thoại"
            >
              <i className="fas fa-times" aria-hidden="true"></i>
              <span>Đóng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustedPartnerInfoModal;
