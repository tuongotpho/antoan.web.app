import React from 'react';
import { TrustedPartner } from '../types';
import { validateAndFormatUrl } from '../utils/validationHelpers';

interface TrustedPartnerCardProps {
  partner: TrustedPartner;
  /** Mở hộp thông tin chi tiết của đối tác. */
  onClick: () => void;
}

const TrustedPartnerCard: React.FC<TrustedPartnerCardProps> = ({ partner, onClick }) => {
  // Bấm vào thẻ thì sang thẳng trang web của đối tác.
  //
  // validateAndFormatUrl tự thêm https:// khi người nhập chỉ gõ tên miền, và
  // trả về chuỗi rỗng nếu địa chỉ không dùng được — lúc đó thẻ quay lại hành vi
  // cũ là mở hộp thông tin, chứ không dẫn người dùng tới một liên kết hỏng.
  const trangWeb = validateAndFormatUrl(partner.website);

  return (
    <div
      onClick={trangWeb ? undefined : onClick}
      className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group hover:-translate-y-2 ${
        trangWeb ? '' : 'cursor-pointer'
      }`}
    >
      {/* Liên kết phủ kín thẻ. Dùng thẻ <a> phủ lên thay vì bọc cả thẻ trong
          <a>, vì bên trong còn một nút bấm — mà HTML không cho đặt nút lồng
          trong liên kết. Cách này giữ được cả hai: bấm chỗ nào cũng sang trang
          đối tác, riêng nút "Xem chi tiết" nổi lên trên vẫn bấm riêng được. */}
      {trangWeb && (
        <a
          href={trangWeb}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="absolute inset-0 z-20"
          aria-label={`Mở trang web của ${partner.businessName} (mở tab mới)`}
        >
          <span className="sr-only">{partner.businessName}</span>
        </a>
      )}
      {/* Verified Badge */}
      {partner.verified && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-md">
            <i className="fas fa-check-circle"></i>
            <span>Đã xác nhận</span>
          </div>
        </div>
      )}

      {/* Logo/Image Section */}
      <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        {partner.logo ? (
          <img
            src={partner.logo}
            alt={partner.businessName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="text-center p-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-orange-600 rounded-2xl flex items-center justify-center mb-2 group-hover:rotate-6 transition-transform duration-300">
              <i className="fas fa-building text-4xl text-white"></i>
            </div>
          </div>
        )}
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-neutral-dark mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {partner.businessName}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{partner.description}</p>

        {/* Specializations */}
        {partner.specializations && partner.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {partner.specializations.slice(0, 2).map((spec, index) => (
              <span
                key={index}
                className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium"
              >
                {spec}
              </span>
            ))}
            {partner.specializations.length > 2 && (
              <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium">
                +{partner.specializations.length - 2} thêm
              </span>
            )}
          </div>
        )}

        {/* Info Grid */}
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <i className="fas fa-id-card w-4 text-gray-400"></i>
            <span className="font-mono text-xs">{partner.taxId}</span>
          </div>
          {partner.website && (
            <div className="flex items-center gap-2">
              <i className="fas fa-globe w-4 text-gray-400"></i>
              <span className="text-xs truncate text-blue-600">{partner.website}</span>
              {/* Dấu hiệu cho biết bấm vào thẻ sẽ mở sang trang khác, ở tab mới. */}
              <i className="fas fa-arrow-up-right-from-square text-[10px] text-blue-400 shrink-0"></i>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            {partner.establishedYear && `Từ ${partner.establishedYear}`}
          </span>
          <button
            type="button"
            onClick={(e) => {
              // Chặn cả nổi bọt lẫn hành vi mặc định: nút này nằm ĐÈ lên liên
              // kết phủ kín thẻ, không chặn thì bấm "Xem chi tiết" lại nhảy
              // sang trang đối tác.
              e.preventDefault();
              e.stopPropagation();
              onClick();
            }}
            className="relative z-30 flex items-center gap-1.5 text-primary font-semibold text-sm hover:gap-2.5 transition-all rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <span>Xem chi tiết</span>
            <i className={`fas ${trangWeb ? 'fa-circle-info' : 'fa-arrow-right'}`}></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrustedPartnerCard;
