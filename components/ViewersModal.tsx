import React from 'react';
import { PartnerProfile } from '../types';
import { useDongBangEsc } from '../hooks/useDongBangEsc';

interface ViewersModalProps {
  partners: PartnerProfile[];
  onClose: () => void;
}

const ViewersModal: React.FC<ViewersModalProps> = ({ partners, onClose }) => {
  // Bấm Esc để đóng.
  useDongBangEsc(true, onClose);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-2xl font-bold text-primary">Đơn vị đã xem</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>

        {partners.length > 0 ? (
          <div className="space-y-3">
            {partners.map((partner) => (
              <div key={partner.uid} className="bg-gray-50 p-4 rounded-lg border">
                <p className="font-bold text-neutral-dark">
                  <a href={`mailto:${partner.email}`} className="text-accent hover:underline">
                    {partner.email}
                  </a>
                </p>
                <p className="text-sm text-gray-600">
                  SĐT:{' '}
                  <a href={`tel:${partner.phone}`} className="text-accent hover:underline">
                    {partner.phone}
                  </a>
                </p>
                <p className="text-sm text-gray-600">MST: {partner.taxId}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">Chưa có đơn vị nào xem yêu cầu này.</p>
        )}

        <div className="mt-6 pt-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewersModal;
