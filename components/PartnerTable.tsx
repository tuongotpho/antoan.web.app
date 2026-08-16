import React from 'react';
import { PartnerProfile } from '../types';

interface PartnerTableProps {
  partners: PartnerProfile[];
  onDelete?: (uid: string) => void;
  onUpdateStatus?: (uid: string, status: 'approved' | 'rejected') => void;
  viewType: 'pending' | 'managed';
  onViewDetails?: (partner: PartnerProfile) => void;
}

const PartnerTable: React.FC<PartnerTableProps> = ({
  partners,
  onDelete,
  onUpdateStatus,
  viewType,
  onViewDetails,
}) => {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Email
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Mã số thuế
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Điện thoại
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Năng lực
            </th>
            {viewType === 'managed' && (
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Trạng thái
              </th>
            )}
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Hành động</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {partners.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                {viewType === 'pending'
                  ? 'Không có đối tác nào chờ phê duyệt.'
                  : 'Không có đối tác trong danh sách này.'}
              </td>
            </tr>
          ) : (
            partners.map((partner) => (
              <tr
                key={partner.uid}
                onClick={() => onViewDetails && onViewDetails(partner)}
                className={onViewDetails ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {partner.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {partner.taxId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {partner.phone}
                </td>
                <td
                  className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate"
                  title={(partner.capabilities || []).join(', ')}
                >
                  {(partner.capabilities || []).join(', ')}
                </td>
                {viewType === 'managed' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        partner.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {partner.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  {viewType === 'pending' && onUpdateStatus && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(partner.uid, 'approved');
                        }}
                        className="text-green-600 hover:text-green-900 font-bold"
                      >
                        Duyệt
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(partner.uid, 'rejected');
                        }}
                        className="text-yellow-600 hover:text-yellow-900 font-bold"
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  {viewType === 'managed' && onDelete && (
                    {/* Xoá hồ sơ đối tác là xoá vĩnh viễn, không hoàn tác. */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Ngăn sự kiện click của hàng
                        const ten =
                          partner.businessName || partner.taxId || partner.email || 'không rõ tên';
                        if (
                          window.confirm(
                            `Xoá vĩnh viễn hồ sơ đối tác "${ten}"?\n\n` +
                              'Không khôi phục lại được.'
                          )
                        ) {
                          onDelete(partner.uid);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PartnerTable;
