import React, { useState } from 'react';
import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  doc,
  setDoc,
  serverTimestamp,
} from '../services/firebaseConfig';
import { PARTNER_CAPABILITIES } from '../types';
import { isValidPhone, isValidTaxId } from '../utils/validationHelpers';

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgotPassword'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const initialRegisterState = {
    businessName: '',
    taxId: '',
    address: '',
    phone: '',
    website: '',
    description: '',
    notableClients: '',
    capabilities: [] as string[],
    subscribesToEmails: true,
  };
  const [registerData, setRegisterData] = useState(initialRegisterState);

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCapabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setRegisterData((prev) => {
      const capabilities = checked
        ? [...prev.capabilities, value]
        : prev.capabilities.filter((c) => c !== value);
      return { ...prev, capabilities };
    });
  };

  const handleSubscribeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterData((prev) => ({ ...prev, subscribesToEmails: e.target.checked }));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!registerData.phone.trim()) {
          setError('Vui lòng nhập số điện thoại.');
          setLoading(false);
          return;
        }
        // Dùng các hàm kiểm tra đã có sẵn trong dự án. Màn hình này trước đây
        // không kiểm gì cả, nên một số điện thoại gõ sai vẫn vào thẳng cơ sở
        // dữ liệu — mà đó lại là cách duy nhất để khách liên hệ với đối tác.
        if (!isValidPhone(registerData.phone.trim())) {
          setError('Số điện thoại không hợp lệ. Vui lòng nhập số di động Việt Nam (10 chữ số).');
          setLoading(false);
          return;
        }
        if (!registerData.businessName.trim()) {
          setError('Vui lòng nhập tên doanh nghiệp.');
          setLoading(false);
          return;
        }
        // Mã số thuế không bắt buộc, nhưng đã điền thì phải đúng dạng
        if (registerData.taxId.trim() && !isValidTaxId(registerData.taxId.trim())) {
          setError('Mã số thuế không hợp lệ. Nhập 10 chữ số, hoặc dạng 10 chữ số - 3 chữ số.');
          setLoading(false);
          return;
        }
        if (registerData.capabilities.length === 0) {
          setError('Vui lòng chọn ít nhất một năng lực đào tạo.');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        if (user) {
          const partnerDocRef = doc(db, 'partners', user.uid);
          try {
            await setDoc(partnerDocRef, {
              uid: user.uid,
              email: email,
              businessName: registerData.businessName,
              taxId: registerData.taxId,
              address: registerData.address,
              phone: registerData.phone,
              website: registerData.website,
              // Để trống thì lưu chuỗi rỗng. TRƯỚC ĐÂY dùng
              // `registerData.description || 'description'`, nghĩa là đối tác
              // không điền mô tả thì hồ sơ lưu đúng chữ "description" — và
              // chữ đó hiện ra trên thẻ giới thiệu ở trang chủ.
              description: registerData.description?.trim() || '',
              notableClients: registerData.notableClients,
              capabilities: registerData.capabilities,
              subscribesToEmails: registerData.subscribesToEmails,
              createdAt: serverTimestamp(),
              status: 'pending',
              membership: 'free',
              verified: false,
              featured: false,
            });
          } catch (loiHoSo) {
            // Tài khoản đăng nhập ĐÃ được tạo ở bước trên, chỉ hồ sơ là chưa
            // lưu được. Nếu để lỗi này rơi vào phần bắt lỗi chung, người dùng
            // chỉ thấy "Đã xảy ra lỗi, vui lòng thử lại" rồi đăng ký lại — và
            // lần đó nhận "Email này đã được sử dụng". Tắc hoàn toàn: có tài
            // khoản nhưng không có hồ sơ, mà cũng không đăng ký lại được.
            console.error('Tạo tài khoản xong nhưng chưa lưu được hồ sơ:', loiHoSo);
            setError(
              'Đã tạo được tài khoản nhưng chưa lưu được hồ sơ doanh nghiệp. ' +
                'Anh/chị hãy đăng nhập bằng email và mật khẩu vừa đăng ký, rồi liên hệ ' +
                'quản trị viên để hoàn tất hồ sơ. Không cần đăng ký lại.'
            );
            setLoading(false);
            return;
          }
        }
      }
      onClose();
    } catch (err: any) {
      switch (err.code) {
        case 'auth/user-not-found':
          setError('Không tìm thấy tài khoản với email này.');
          break;
        case 'auth/wrong-password':
          setError('Mật khẩu không chính xác.');
          break;
        case 'auth/email-already-in-use':
          setError('Email này đã được sử dụng.');
          break;
        case 'auth/weak-password':
          setError('Mật khẩu phải có ít nhất 6 ký tự.');
          break;
        case 'auth/invalid-email':
          setError('Địa chỉ email không hợp lệ.');
          break;
        default:
          setError('Đã xảy ra lỗi. Vui lòng thử lại.');
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(
        'Link khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn (bao gồm cả mục spam).'
      );
    } catch (err: any) {
      switch (err.code) {
        case 'auth/user-not-found':
          setError('Không tìm thấy tài khoản nào với địa chỉ email này.');
          break;
        case 'auth/invalid-email':
          setError('Địa chỉ email không hợp lệ.');
          break;
        default:
          setError('Đã xảy ra lỗi khi gửi email khôi phục. Vui lòng thử lại.');
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    'w-full p-3 border border-gray-300 rounded-lg bg-white text-neutral-dark focus:ring-2 focus:ring-primary placeholder-gray-500';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {view === 'login' && (
          <>
            <h2 className="text-2xl font-bold text-center text-primary mb-2">Đăng nhập Đối tác</h2>
            <p className="text-center text-neutral-dark mb-6 text-sm">
              Truy cập để xem thông tin chi tiết và báo giá các yêu cầu.
            </p>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                aria-label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                required
              />
              <div>
                <input
                  type="password"
                  placeholder="Mật khẩu"
                  aria-label="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClasses}
                  required
                />
                <div className="text-right mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgotPassword');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-sm text-accent hover:underline font-medium"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center bg-primary text-white font-bold py-3 rounded-lg hover:opacity-90 transition duration-300 disabled:bg-primary-dark disabled:opacity-75 disabled:cursor-wait"
              >
                {loading ? (
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
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>
          </>
        )}

        {view === 'register' && (
          <>
            <h2 className="text-2xl font-bold text-center text-primary mb-2">
              Đăng ký Hồ sơ Đối tác
            </h2>
            <p className="text-center text-neutral-dark mb-6 text-sm">
              Hoàn thành hồ sơ để kết nối với các doanh nghiệp có nhu cầu.
            </p>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="email"
                  placeholder="Email đăng nhập (*)"
                  aria-label="Email đăng nhập"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                  required
                />
                <input
                  type="password"
                  placeholder="Mật khẩu (*)"
                  aria-label="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
              <input
                type="text"
                name="businessName"
                placeholder="Tên doanh nghiệp (*)"
                aria-label="Tên doanh nghiệp"
                value={registerData.businessName}
                onChange={handleRegisterChange}
                className={inputClasses}
                required
              />
              <input
                type="text"
                name="taxId"
                placeholder="Mã số thuế (*)"
                aria-label="Mã số thuế"
                value={registerData.taxId}
                onChange={handleRegisterChange}
                className={inputClasses}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="address"
                  placeholder="Địa chỉ công ty (*)"
                  aria-label="Địa chỉ công ty"
                  value={registerData.address}
                  onChange={handleRegisterChange}
                  className={inputClasses}
                  required
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Số điện thoại (*)"
                  aria-label="Số điện thoại"
                  value={registerData.phone}
                  onChange={handleRegisterChange}
                  className={inputClasses}
                  required
                />
              </div>
              <input
                type="url"
                name="website"
                placeholder="Website (nếu có)"
                aria-label="Website"
                value={registerData.website}
                onChange={handleRegisterChange}
                className={inputClasses}
              />
              <textarea
                name="description"
                placeholder="Mô tả về doanh nghiệp và năng lực đào tạo"
                aria-label="Mô tả về doanh nghiệp và năng lực đào tạo"
                value={registerData.description}
                onChange={handleRegisterChange}
                rows={3}
                className={inputClasses}
              />
              <textarea
                name="notableClients"
                placeholder="Các khách hàng/dự án tiêu biểu (cách nhau bởi dấu phẩy)"
                aria-label="Các khách hàng/dự án tiêu biểu"
                value={registerData.notableClients}
                onChange={handleRegisterChange}
                rows={2}
                className={inputClasses}
              />
              <div>
                <label className="font-semibold text-neutral-dark mb-2 block text-sm">
                  Năng lực đào tạo (*)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 max-h-40 overflow-y-auto p-3 border rounded-lg bg-gray-50">
                  {PARTNER_CAPABILITIES.map((type) => (
                    <label
                      key={type}
                      className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        value={type}
                        onChange={handleCapabilityChange}
                        checked={registerData.capabilities.includes(type)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center space-x-3 text-sm text-gray-700 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  name="subscribesToEmails"
                  checked={registerData.subscribesToEmails}
                  onChange={handleSubscribeChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span>Tôi muốn nhận email thông báo khi có yêu cầu mới.</span>
              </label>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center bg-primary text-white font-bold py-3 rounded-lg hover:opacity-90 transition duration-300 disabled:bg-primary-dark disabled:opacity-75 disabled:cursor-wait"
              >
                {loading ? (
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
                ) : (
                  'Hoàn tất Đăng ký'
                )}
              </button>
            </form>
          </>
        )}

        {view === 'forgotPassword' && (
          <>
            <h2 className="text-2xl font-bold text-center text-primary mb-2">Khôi phục mật khẩu</h2>
            <p className="text-center text-neutral-dark mb-6 text-sm">
              Nhập địa chỉ email đã đăng ký để nhận link khôi phục.
            </p>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                aria-label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                required
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              {success && (
                <p className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg">
                  {success}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center bg-primary text-white font-bold py-3 rounded-lg hover:opacity-90 transition duration-300 disabled:bg-primary-dark disabled:opacity-75 disabled:cursor-wait"
              >
                {loading ? (
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
                  'Gửi Link Khôi Phục'
                )}
              </button>
            </form>
            <p className="text-center text-sm mt-6">
              <button
                onClick={() => {
                  setView('login');
                  setError('');
                  setSuccess('');
                }}
                className="text-accent font-semibold ml-1 hover:underline"
              >
                Quay lại Đăng nhập
              </button>
            </p>
          </>
        )}

        {view !== 'forgotPassword' && (
          <p className="text-center text-sm mt-6">
            {view === 'login' ? 'Chưa có tài khoản Đối tác?' : 'Đã có tài khoản?'}
            <button
              onClick={() => {
                setView(view === 'login' ? 'register' : 'login');
                setError('');
                setSuccess('');
              }}
              className="text-accent font-semibold ml-1 hover:underline"
            >
              {view === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
