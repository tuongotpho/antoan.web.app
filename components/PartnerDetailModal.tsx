import React, { useState } from 'react';
import { PartnerProfile } from '../types';
import { useDongBangEsc } from '../hooks/useDongBangEsc';
import { useKhoaConTroTrongHop } from '../hooks/useKhoaConTroTrongHop';
import { dungCapNhatDoiTac } from '../utils/hoSoDoiTac';

interface PartnerDetailModalProps {
  partner: PartnerProfile;
  onClose: () => void;
  onApprove: (uid: string) => void;
  onReject: (uid: string) => void;
  onUpdate?: (uid: string, updates: Partial<PartnerProfile>) => void;
}

const DetailItem: React.FC<{ label: string; value?: string | string[] }> = ({ label, value }) => (
  <div>
    <p className="text-sm font-semibold text-gray-500">{label}</p>
    {Array.isArray(value) && value.length > 0 ? (
      <ul className="list-disc list-inside mt-1 space-y-1">
        {value.map((item, index) => (
          <li key={index} className="text-neutral-dark">
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-neutral-dark">{value || 'Chưa cung cấp'}</p>
    )}
  </div>
);

const PartnerDetailModal: React.FC<PartnerDetailModalProps> = ({
  partner,
  onClose,
  onApprove,
  onReject,
  onUpdate,
}) => {
  // Đây là modal DUY NHẤT còn thiếu phần này: 5 modal kia đều đã có Esc để
  // đóng, khoá con trỏ bàn phím bên trong, và role="dialog".
  useDongBangEsc(true, onClose);
  const hopRef = useKhoaConTroTrongHop(true);

  const [verified, setVerified] = useState(partner.verified || false);
  const [featured, setFeatured] = useState(partner.featured || false);
  const [displayOrder, setDisplayOrder] = useState(partner.displayOrder?.toString() || '');

  const handleSaveSettings = () => {
    if (!onUpdate) return;

    // Lệnh cập nhật dựng ở utils/hoSoDoiTac.ts để test canh được: nó phải
    // KHÔNG chứa giá trị undefined nào, nếu không Firestore huỷ cả lệnh.
    onUpdate(partner.uid, dungCapNhatDoiTac(verified, featured, displayOrder));
  };

  const isApproved = partner.status === 'approved';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        ref={hopRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tieu-de-chi-tiet-doi-tac"
        className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 id="tieu-de-chi-tiet-doi-tac" className="text-2xl font-bold text-primary">
            Chi tiết Đối tác
          </h2>
          {/* Nút chỉ có biểu tượng dấu nhân thì trình đọc màn hình không có gì
              để đọc. */}
          <button
            onClick={onClose}
            aria-label="Đóng chi tiết đối tác"
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="fas fa-times text-2xl" aria-hidden="true"></i>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">Trạng thái</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                partner.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : partner.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {partner.status === 'approved'
                ? 'Đã duyệt'
                : partner.status === 'pending'
                  ? 'Chờ duyệt'
                  : 'Từ chối'}
            </span>
          </div>
          <DetailItem label="Tên doanh nghiệp" value={partner.businessName} />
          <div>
            <p className="text-sm font-semibold text-gray-500">Email</p>
            <a href={`mailto:${partner.email}`} className="text-accent hover:underline">
              {partner.email}
            </a>
          </div>
          <DetailItem label="Mã số thuế" value={partner.taxId} />
          <div>
            <p className="text-sm font-semibold text-gray-500">Số điện thoại</p>
            <a href={`tel:${partner.phone}`} className="text-accent hover:underline">
              {partner.phone}
            </a>
          </div>
          <DetailItem label="Địa chỉ" value={partner.address} />
          <DetailItem label="Website" value={partner.website} />
          <DetailItem label="Mô tả" value={partner.description} />
          <DetailItem label="Khách hàng/Dự án tiêu biểu" value={partner.notableClients} />
          <DetailItem label="Năng lực đào tạo" value={partner.capabilities} />
          <DetailItem
            label="Nhận email thông báo"
            value={partner.subscribesToEmails ? 'Có' : 'Không'}
          />
        </div>

        {/* Admin Settings - Only show for approved partners */}
        {isApproved && onUpdate && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-lg font-bold text-neutral-dark mb-3">
              <i className="fas fa-cog mr-2"></i>Cài đặt hiển thị
            </h3>
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <div>
                  <span className="font-semibold text-neutral-dark">Đối tác tin cậy</span>
                  <p className="text-xs text-gray-600">Hiển thị huy hiệu "Đã xác minh"</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <div>
                  <span className="font-semibold text-neutral-dark">Featured Partner</span>
                  <p className="text-xs text-gray-600">Hiển thị trên trang chủ (tối đa 3)</p>
                </div>
              </label>

              <div>
                <label className="block font-semibold text-neutral-dark mb-1">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Nhập số (1, 2, 3...)"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-gray-600 mt-1">Số nhỏ hơn = hiển thị trước</p>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition"
              >
                <i className="fas fa-save mr-2"></i>Lưu cài đặt
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition"
          >
            Đóng
          </button>
          {partner.status === 'pending' && (
            <>
              <button
                onClick={() => onReject(partner.uid)}
                className="bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-yellow-600 transition"
              >
                Từ chối
              </button>
              <button
                onClick={() => onApprove(partner.uid)}
                className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition"
              >
                Phê duyệt
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerDetailModal;
