import React from 'react';
import { TrainingRequest } from '../types';

interface RequestTableProps {
  requests: TrainingRequest[];
  onDelete: (id: string) => void;
}

const RequestTable: React.FC<RequestTableProps> = ({ requests, onDelete }) => {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Khách hàng
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
              Địa điểm
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Lượt xem
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Hành động</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {requests.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                Chưa có yêu cầu nào được tạo.
              </td>
            </tr>
          ) : (
            requests.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {request.clientName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {request.clientPhone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {request.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center font-bold">
                  {request.viewedBy?.length || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Xoá yêu cầu là xoá vĩnh viễn một khách hàng tiềm năng —
                      không có thùng rác, không hoàn tác được. Trước đây bấm là
                      mất luôn, trong khi xoá bình luận hay bài viết lại có hỏi
                      lại. Chỗ đáng hỏi nhất thì lại là chỗ duy nhất không hỏi. */}
                  <button
                    onClick={() => {
                      const ten = request.clientName || 'không rõ tên';
                      const cty = request.location ? ` (${request.location})` : '';
                      if (
                        window.confirm(
                          `Xoá vĩnh viễn yêu cầu của "${ten}"${cty}?\n\n` +
                            'Không khôi phục lại được.'
                        )
                      ) {
                        onDelete(request.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RequestTable;
