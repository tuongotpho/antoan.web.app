import React, { useState } from 'react';
import {
  db,
  sendEmail,
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from '../services/firebaseConfig';
import { TrainingRequest } from '../types';
import { generateQuoteNotificationEmail } from '../utils/emailTemplates';
import {
  getOrCreateAdminPartnerChatRoom,
  sendQuoteNotificationToAdminChat,
} from '../utils/chatHelpers';
import { layTenHienThiDoiTac, khachDongYNhanEmail } from '../utils/quoteHelpers';

interface QuoteFormProps {
  request: TrainingRequest;
  partnerUid: string;
  partnerEmail: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const QuoteForm: React.FC<QuoteFormProps> = ({
  request,
  partnerUid,
  partnerEmail,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    price: '',
    timeline: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/[^\d]/g, '');
    // Format with thousands separator
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setFormData((prev) => ({ ...prev, price: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.price || !formData.timeline || !formData.notes) {
      setError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    const priceNumber = parseInt(formData.price.replace(/\./g, ''));
    if (isNaN(priceNumber) || priceNumber <= 0) {
      setError('Giá báo phải là số dương.');
      return;
    }

    setSubmitting(true);

    try {
      // Get partner name
      const partnerDocRef = doc(db, 'partners', partnerUid);
      const partnerDoc = await getDoc(partnerDocRef);
      const partnerData = partnerDoc.data();
      const partnerName = layTenHienThiDoiTac(partnerData, partnerEmail);

      // Create quote document
      const quoteData = {
        requestId: request.id,
        partnerId: partnerUid,
        partnerEmail: partnerEmail,
        partnerName: partnerName,
        price: priceNumber,
        currency: 'VND',
        timeline: formData.timeline,
        notes: formData.notes,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      const quotesCollection = collection(db, 'quotes');
      await addDoc(quotesCollection, quoteData);

      // Tạo phòng chat với admin (nếu chưa có) và gửi thông báo
      try {
        const chatRoomId = await getOrCreateAdminPartnerChatRoom(
          request,
          partnerUid,
          partnerName,
          partnerEmail
        );
        await sendQuoteNotificationToAdminChat(chatRoomId, partnerUid, partnerName, priceNumber);
      } catch (chatError) {
        console.error('Error creating chat room:', chatError);
        // Không fail toàn bộ operation nếu chat bị lỗi
      }

      // Gửi email báo cho khách — nhưng chỉ khi khách đồng ý nhận.
      if (!khachDongYNhanEmail(request)) {
        setSuccess('Báo giá đã được gửi thành công! (Khách hàng đã chọn không nhận email thông báo)');
      } else {
        try {
          const emailHtml = generateQuoteNotificationEmail({
            clientName: request.clientName,
            requestId: request.id,
            partnerName: partnerName,
            partnerEmail: partnerEmail,
            price: priceNumber,
            timeline: formData.timeline,
            notes: formData.notes,
            trainingDetails: request.trainingDetails,
          });

          await sendEmail(request.clientEmail, 'Bạn có báo giá mới từ đối tác đào tạo', emailHtml);
          setSuccess('Báo giá đã được gửi thành công! Khách hàng sẽ nhận được thông báo qua email.');
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          // Không để lỗi gửi mail làm hỏng cả việc lưu báo giá
          setSuccess('Báo giá đã được lưu thành công! (Lưu ý: Có lỗi khi gửi email thông báo)');
        }
      }

      // Reset form
      setFormData({ price: '', timeline: '', notes: '' });
      onSuccess?.();

      // Auto close after 3 seconds to let user see the success message
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error submitting quote:', error);
      setError('Đã xảy ra lỗi khi gửi báo giá. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-orange-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Gửi Báo Giá</h2>
              <p className="text-sm opacity-90 mt-1">Cung cấp thông tin báo giá cho khách hàng</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Request Info */}
        <div className="p-6 bg-gray-50 border-b">
          <h3 className="font-bold text-lg mb-3 text-neutral-dark">Thông Tin Yêu Cầu</h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Khách hàng:</span>
              <span className="ml-2">{request.clientName}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Địa điểm:</span>
              <span className="ml-2">{request.location}</span>
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold text-gray-700">Nội dung đào tạo:</span>
              <div className="mt-1">
                {request.trainingDetails.map((detail, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-primary bg-opacity-10 text-primary px-2 py-1 rounded mr-2 mb-1 text-xs"
                  >
                    {detail.type} ({detail.participants} người)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quote Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-neutral-dark mb-2">
              <i className="fas fa-dollar-sign text-primary mr-2"></i>
              Giá Báo (VND) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handlePriceChange}
                placeholder="Ví dụ: 5.000.000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                VND
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <i className="fas fa-info-circle mr-1"></i>
              Nhập giá không bao gồm dấu phẩy (số sẽ tự động được format)
            </p>
          </div>

          {/* Timeline */}
          <div>
            <label className="block text-sm font-semibold text-neutral-dark mb-2">
              <i className="fas fa-clock text-primary mr-2"></i>
              Thời Gian Thực Hiện <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="timeline"
              value={formData.timeline}
              onChange={handleChange}
              placeholder="Ví dụ: 3-5 ngày, 1 tuần, 2 tuần"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              <i className="fas fa-info-circle mr-1"></i>
              Thời gian dự kiến để hoàn thành khóa đào tạo
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-neutral-dark mb-2">
              <i className="fas fa-file-alt text-primary mr-2"></i>
              Chi Tiết Báo Giá <span className="text-red-500">*</span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Mô tả chi tiết về chương trình đào tạo, giảng viên, tài liệu, chứng chỉ..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              <i className="fas fa-info-circle mr-1"></i>
              Cung cấp thông tin càng chi tiết càng tốt để khách hàng dễ dàng đánh giá
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={submitting || !!success}
              className="flex-1 bg-gradient-to-r from-primary to-orange-600 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Đang gửi...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>
                  Gửi Báo Giá
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 sm:flex-none bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {success ? 'Đóng' : 'Hủy'}
            </button>
          </div>

          {/* Success message - hiển thị ngay dưới nút submit */}
          {success && (
            <div
              className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg relative animate-pulse"
              role="alert"
            >
              <div className="flex items-start">
                <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-bold text-lg">Thành công!</p>
                  <p className="text-sm mt-1">{success}</p>
                  <p className="text-xs mt-2 opacity-75">
                    <i className="fas fa-info-circle mr-1"></i>
                    Cửa sổ này sẽ tự động đóng sau 3 giây...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <i className="fas fa-info-circle text-blue-500 text-xl mr-3 mt-0.5"></i>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Lưu ý:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Khách hàng sẽ nhận email thông báo ngay khi bạn gửi báo giá</li>
                  <li>Khách hàng có thể so sánh nhiều báo giá từ các đối tác khác nhau</li>
                  <li>Hãy cung cấp thông tin chính xác và đầy đủ để tăng cơ hội được chọn</li>
                  <li>Bạn có thể được liên hệ trực tiếp nếu khách hàng quan tâm</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuoteForm;
