import React, { useState } from 'react';
import {
  db,
  sendEmail,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from '../services/firebaseConfig';
import { TRAINING_TYPES, TRAINING_GROUPS } from '../types';
import { generatePartnerNotificationEmail } from '../utils/emailTemplates';
import { isValidEmail, isValidPhone } from '../utils/validationHelpers';

const TrainingRequestForm: React.FC = () => {
  const initialDetailState = {
    type: TRAINING_TYPES[0],
    group: TRAINING_GROUPS[0],
    participants: '',
    customType: '',
  };
  const initialFormState = {
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    trainingDuration: '',
    preferredTime: '',
    description: '',
    location: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [trainingDetails, setTrainingDetails] = useState([initialDetailState]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [clientSubscribesToEmails, setClientSubscribesToEmails] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Cả ba hàm dưới đây đều cập nhật theo KIỂU HÀM: `setX(truoc => ...)` thay vì
  // `setX([...trainingDetails, ...])`.
  //
  // Lý do rất cụ thể, đã đo được: bản cũ đọc giá trị `trainingDetails` của lượt
  // vẽ hiện tại. Bấm "Thêm nội dung huấn luyện" hai lần thật nhanh thì cả hai
  // lần cùng đọc một giá trị cũ như nhau, lần sau ghi đè lần trước — bấm hai
  // lần mà chỉ ra một dòng. Cách viết mới luôn nhận danh sách mới nhất.
  const handleDetailChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setTrainingDetails((truoc) =>
      truoc.map((dong, i) => (i === index ? { ...dong, [name]: value } : dong))
    );
  };

  const addDetail = () => {
    setTrainingDetails((truoc) => [...truoc, { ...initialDetailState }]);
  };

  const removeDetail = (index: number) => {
    setTrainingDetails((truoc) => truoc.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (
      !formData.clientName ||
      !formData.clientEmail ||
      !formData.clientPhone ||
      !formData.description ||
      !formData.location ||
      !formData.trainingDuration ||
      !formData.preferredTime
    ) {
      setError('Vui lòng điền đầy đủ các trường thông tin chung.');
      return;
    }

    if (!isValidEmail(formData.clientEmail)) {
      setError('Email không đúng định dạng. Vui lòng kiểm tra lại.');
      return;
    }

    if (!isValidPhone(formData.clientPhone)) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 số).');
      return;
    }

    const processedDetails = [];
    for (const detail of trainingDetails) {
      const finalType = detail.type.startsWith('Khác') ? detail.customType : detail.type;
      if (!finalType.trim() || !detail.participants) {
        setError('Vui lòng điền đầy đủ loại hình và số lượng cho tất cả các nội dung huấn luyện.');
        return;
      }
      const participantsNum = parseInt(detail.participants, 10);
      if (isNaN(participantsNum) || participantsNum <= 0) {
        setError('Số lượng học viên phải là một số dương.');
        return;
      }
      // Chặn trên: trước đây nhập bao nhiêu cũng được, nên một con số gõ nhầm
      // (hoặc cố tình) vẫn vào thẳng cơ sở dữ liệu và bắn thông báo cho admin.
      if (participantsNum > 10000) {
        setError('Số lượng học viên quá lớn. Vui lòng liên hệ trực tiếp qua hotline để được hỗ trợ.');
        return;
      }
      processedDetails.push({
        type: finalType,
        group: detail.group,
        participants: participantsNum,
      });
    }

    setSubmitting(true);
    try {
      const trainingRequestsCollection = collection(db, 'trainingRequests');
      const requestRef = await addDoc(trainingRequestsCollection, {
        ...formData,
        trainingDetails: processedDetails,
        createdAt: serverTimestamp(),
        viewedBy: [],
        urgent: isUrgent,
        clientSubscribesToEmails: clientSubscribesToEmails,
      });

      /* 
      // Gửi email thông báo cho các đối tác phù hợp (Được vô hiệu hóa do hệ thống chuyển sang dùng thông báo Telegram)
      let emailNotificationMessage = '';
      try {
        // Lấy danh sách đối tác có năng lực phù hợp
        const trainingTypes = processedDetails.map((detail) => detail.type);

        const partnersCollection = collection(db, 'partners');
        const q = query(
          partnersCollection,
          where('status', '==', 'approved'),
          where('subscribesToEmails', '==', true)
        );
        const partnersQuery = await getDocs(q);

        const matchingPartners = [];
        partnersQuery.forEach((doc) => {
          const partner = doc.data();
          // Kiểm tra xem đối tác có năng lực phù hợp với bất kỳ loại đào tạo nào trong yêu cầu không
          const hasMatchingCapability =
            partner.capabilities &&
            partner.capabilities.some((capability) => trainingTypes.includes(capability));
          if (hasMatchingCapability) {
            matchingPartners.push(partner);
          }
        });

        // Gửi email thông báo cho các đối tác phù hợp
        if (matchingPartners.length > 0) {
          const partnerEmails = matchingPartners.map((partner) => partner.email);
          const trainingTypesText = trainingTypes.join(', ');

          // Generate beautiful HTML email template
          const emailHtml = generatePartnerNotificationEmail(
            processedDetails,
            {
              clientName: formData.clientName,
              clientEmail: formData.clientEmail,
              clientPhone: formData.clientPhone,
              location: formData.location,
              description: formData.description,
              trainingDuration: formData.trainingDuration,
              preferredTime: formData.preferredTime,
            },
            isUrgent
          );

          await sendEmail(partnerEmails, `🎯 Yêu cầu đào tạo mới: ${trainingTypesText}`, emailHtml);

          emailNotificationMessage = ` Đã gửi thông báo đến ${matchingPartners.length} đơn vị đào tạo phù hợp.`;
        } else {
          emailNotificationMessage =
            ' Lưu ý: Hiện chưa có đơn vị đào tạo nào phù hợp trong hệ thống, nhưng yêu cầu của bạn đã được lưu lại.';
        }
      } catch (emailErr) {
        console.error('Error sending notification emails:', emailErr);
        // Không throw lỗi này để không ảnh hưởng đến việc tạo yêu cầu
        emailNotificationMessage =
          ' (Lưu ý: Có lỗi khi gửi email thông báo, nhưng yêu cầu của bạn đã được lưu thành công)';
      }
      */

      setSuccess('Yêu cầu của bạn đã được gửi thành công! Các đơn vị đào tạo sẽ sớm liên hệ với bạn.');
      setFormData(initialFormState);
      setTrainingDetails([initialDetailState]);
      setIsUrgent(false);
      setClientSubscribesToEmails(true);
    } catch (err) {
      console.error('Error adding document: ', err);
      setError('Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses =
    'w-full p-3 border border-gray-300 rounded-lg bg-white text-neutral-dark focus:ring-2 focus:ring-primary placeholder-gray-500';

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
      <h3 className="text-2xl md:text-3xl font-bold text-neutral-dark mb-4 text-center">
        Tạo Yêu Cầu Đào Tạo Miễn Phí
      </h3>
      <p className="text-gray-600 mb-6 text-sm text-center">
        Thông tin liên hệ của bạn sẽ được bảo mật và chỉ hiển thị cho các đơn vị đào tạo sau khi họ
        đăng nhập.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="font-semibold text-neutral-dark border-b pb-2">Thông tin người liên hệ</h4>
          <input
            type="text"
            name="clientName"
            placeholder="Tên người liên hệ (*)"
            aria-label="Tên người liên hệ"
            autoComplete="name"
            value={formData.clientName}
            onChange={handleChange}
            className={inputClasses}
            required
          />
          <input
            type="email"
            name="clientEmail"
            placeholder="Email (*)"
            aria-label="Email"
            autoComplete="email"
            value={formData.clientEmail}
            onChange={handleChange}
            className={inputClasses}
            required
          />
          <input
            type="tel"
            name="clientPhone"
            placeholder="Số điện thoại (*)"
            aria-label="Số điện thoại"
            autoComplete="tel"
            value={formData.clientPhone}
            onChange={handleChange}
            className={inputClasses}
            required
          />
        </div>

        {/* Training Details */}
        <div className="space-y-4">
          <h4 className="font-semibold text-neutral-dark border-b pb-2">Nội dung huấn luyện</h4>
          {trainingDetails.map((detail, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3 bg-gray-50 relative">
              {trainingDetails.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDetail(index)}
                  // Nút chỉ có biểu tượng thì trình đọc màn hình không có gì để
                  // đọc — người dùng chỉ nghe thấy "nút". Ghi rõ xoá dòng nào.
                  aria-label={`Xoá nội dung huấn luyện số ${index + 1}`}
                  title={`Xoá nội dung huấn luyện số ${index + 1}`}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <i className="fas fa-times-circle" aria-hidden="true"></i>
                </button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  name="type"
                  aria-label="Loại hình huấn luyện"
                  value={detail.type}
                  onChange={(e) => handleDetailChange(index, e)}
                  className={inputClasses}
                  required
                >
                  {TRAINING_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {detail.type.startsWith('Khác') && (
                  <input
                    type="text"
                    name="customType"
                    placeholder="Nội dung đào tạo (*)"
                    aria-label="Nội dung đào tạo"
                    value={detail.customType}
                    onChange={(e) => handleDetailChange(index, e)}
                    className={inputClasses}
                    required
                  />
                )}
                <select
                  name="group"
                  aria-label="Nhóm đối tượng theo Nghị định 44"
                  value={detail.group}
                  onChange={(e) => handleDetailChange(index, e)}
                  className={inputClasses}
                >
                  {TRAINING_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                name="participants"
                placeholder="Số lượng học viên (*)"
                aria-label="Số lượng học viên"
                value={detail.participants}
                onChange={(e) => handleDetailChange(index, e)}
                className={inputClasses}
                required
                min="1"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addDetail}
            className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>Thêm nội dung huấn luyện
          </button>
        </div>

        {/* General Info */}
        <div className="space-y-4">
          <h4 className="font-semibold text-neutral-dark border-b pb-2">Thông tin chung</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="trainingDuration"
              placeholder="Thời gian huấn luyện (VD: 2 ngày) (*)"
              aria-label="Thời gian huấn luyện"
              value={formData.trainingDuration}
              onChange={handleChange}
              className={inputClasses}
              required
            />
            <input
              type="text"
              name="preferredTime"
              placeholder="Thời điểm huấn luyện (VD: T11/2024) (*)"
              aria-label="Thời điểm huấn luyện"
              value={formData.preferredTime}
              onChange={handleChange}
              className={inputClasses}
              required
            />
          </div>
          <input
            type="text"
            name="location"
            placeholder="Địa điểm huấn luyện (*)"
            aria-label="Địa điểm huấn luyện"
            value={formData.location}
            onChange={handleChange}
            className={inputClasses}
            required
          />
          <textarea
            name="description"
            placeholder="Mô tả chi tiết yêu cầu khác (ví dụ: huấn luyện ngoài giờ hành chính, cấp chứng chỉ sau khoá, đào tạo tại nhà máy...)"
            aria-label="Mô tả chi tiết yêu cầu khác"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={inputClasses}
            required
          />
        </div>

        {/* Urgent Request Checkbox */}
        <div className="mt-4 p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <span className="font-semibold text-neutral-dark">
              Yêu cầu báo giá khẩn cấp
              <span className="font-normal text-sm block text-gray-600">
                Đánh dấu nếu bạn cần triển khai huấn luyện trong vòng 7 ngày. Yêu cầu của bạn sẽ
                được ưu tiên hiển thị.
              </span>
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={clientSubscribesToEmails}
              onChange={(e) => setClientSubscribesToEmails(e.target.checked)}
              className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <span className="font-semibold text-neutral-dark">
              Nhận thông báo qua email khi có báo giá mới
              <span className="font-normal text-sm block text-gray-600">
                Chúng tôi sẽ gửi email thông báo khi có đơn vị đào tạo gửi báo giá cho yêu cầu của
                bạn.
              </span>
            </span>
          </label>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex justify-center items-center bg-primary text-white font-bold py-3 rounded-lg hover:opacity-90 transition duration-300 disabled:bg-primary-dark disabled:opacity-75 disabled:cursor-wait"
        >
          {submitting ? (
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
              <span>Đang gửi...</span>
            </>
          ) : (
            'Gửi Yêu Cầu Ngay'
          )}
        </button>

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
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default TrainingRequestForm;
