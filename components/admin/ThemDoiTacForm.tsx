import React, { useState } from 'react';
import { db, collection, doc, setDoc, serverTimestamp } from '../../services/firebaseConfig';
import { PARTNER_CAPABILITIES } from '../../types';
import { isValidPhone, isValidTaxId, isValidEmail } from '../../utils/validationHelpers';

/**
 * Form để quản trị viên tự nhập hồ sơ đối tác.
 *
 * Trước đây đối tác chỉ vào hệ thống bằng cách tự đăng ký rồi chờ duyệt. Với
 * danh sách đơn vị đã có sẵn ngoài đời thì cách đó không dùng được — phải mời
 * từng nơi vào tạo tài khoản.
 *
 * Hồ sơ tạo ở đây KHÔNG kèm tài khoản đăng nhập: nó chỉ là thông tin giới thiệu
 * để hiện trên trang chủ và trang danh sách đối tác. Nếu sau này đơn vị đó muốn
 * tự vào xem yêu cầu và gửi báo giá, họ đăng ký tài khoản riêng như bình thường.
 */

interface Props {
  onXong?: () => void;
}

const ThemDoiTacForm: React.FC<Props> = ({ onXong }) => {
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState('');
  const [thanhCong, setThanhCong] = useState('');

  const trangThaiBanDau = {
    businessName: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    description: '',
    notableClients: '',
    establishedYear: '',
    logo: '',
    capabilities: [] as string[],
    featured: true,
    verified: true,
    displayOrder: '',
  };
  const [duLieu, setDuLieu] = useState(trangThaiBanDau);

  const doiTruong = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setDuLieu((truoc) => ({ ...truoc, [name]: value }));
  };

  const doiNangLuc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setDuLieu((truoc) => ({
      ...truoc,
      capabilities: checked
        ? [...truoc.capabilities, value]
        : truoc.capabilities.filter((c) => c !== value),
    }));
  };

  const guiForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoi('');
    setThanhCong('');

    if (!duLieu.businessName.trim()) {
      setLoi('Vui lòng nhập tên doanh nghiệp.');
      return;
    }
    if (duLieu.capabilities.length === 0) {
      setLoi('Vui lòng chọn ít nhất một lĩnh vực đào tạo.');
      return;
    }
    if (duLieu.phone.trim() && !isValidPhone(duLieu.phone.trim())) {
      setLoi('Số điện thoại không hợp lệ. Nhập số di động Việt Nam gồm 10 chữ số.');
      return;
    }
    if (duLieu.email.trim() && !isValidEmail(duLieu.email.trim())) {
      setLoi('Địa chỉ email không hợp lệ.');
      return;
    }
    if (duLieu.taxId.trim() && !isValidTaxId(duLieu.taxId.trim())) {
      setLoi('Mã số thuế không hợp lệ. Nhập 10 chữ số, hoặc dạng 10 chữ số - 3 chữ số.');
      return;
    }

    setDangLuu(true);
    try {
      // Dùng mã tự sinh: hồ sơ này không gắn với tài khoản đăng nhập nào, nên
      // không có uid để làm mã. Đối tác tự đăng ký thì mã hồ sơ chính là uid.
      const ref = doc(collection(db, 'partners'));
      const nam = parseInt(duLieu.establishedYear, 10);
      const thuTu = parseInt(duLieu.displayOrder, 10);

      await setDoc(ref, {
        uid: ref.id,
        businessName: duLieu.businessName.trim(),
        taxId: duLieu.taxId.trim(),
        email: duLieu.email.trim(),
        phone: duLieu.phone.trim(),
        address: duLieu.address.trim(),
        website: duLieu.website.trim(),
        description: duLieu.description.trim(),
        notableClients: duLieu.notableClients.trim(),
        capabilities: duLieu.capabilities,
        ...(Number.isFinite(nam) ? { establishedYear: nam } : {}),
        ...(Number.isFinite(thuTu) ? { displayOrder: thuTu } : {}),
        subscribesToEmails: false,
        // Admin tự nhập thì duyệt luôn, khỏi phải qua bước phê duyệt.
        status: 'approved',
        membership: 'free',
        verified: duLieu.verified,
        featured: duLieu.featured,
        // Đánh dấu để phân biệt với hồ sơ do đối tác tự đăng ký.
        taoBoiQuanTri: true,
        createdAt: serverTimestamp(),
      });

      setThanhCong(`Đã thêm "${duLieu.businessName.trim()}" vào danh sách đối tác.`);
      setDuLieu(trangThaiBanDau);
      onXong?.();
    } catch (err) {
      console.error('Không thêm được đối tác:', err);
      const ma = (err as { code?: string })?.code || '';
      if (/permission-denied/i.test(ma)) {
        setLoi('Tài khoản đang đăng nhập không có quyền quản trị nên không thêm được đối tác.');
      } else {
        setLoi('Không thêm được đối tác. Vui lòng thử lại.');
      }
    } finally {
      setDangLuu(false);
    }
  };

  const oNhap =
    'w-full p-3 border border-gray-300 rounded-lg bg-white text-neutral-dark focus:ring-2 focus:ring-primary';

  return (
    <form onSubmit={guiForm} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold text-gray-800">
          <i className="fas fa-plus-circle text-primary mr-2"></i>
          Thêm đối tác
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Hồ sơ nhập ở đây được duyệt sẵn và hiện ngay trên trang chủ. Không kèm tài khoản đăng
          nhập — nếu đơn vị muốn tự gửi báo giá thì họ đăng ký riêng.
        </p>
      </div>

      {loi && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {loi}
        </div>
      )}
      {thanhCong && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          <i className="fas fa-check-circle mr-2"></i>
          {thanhCong}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <input
          name="businessName"
          value={duLieu.businessName}
          onChange={doiTruong}
          placeholder="Tên doanh nghiệp (*)"
          aria-label="Tên doanh nghiệp"
          className={oNhap}
        />
        <input
          name="taxId"
          value={duLieu.taxId}
          onChange={doiTruong}
          placeholder="Mã số thuế"
          aria-label="Mã số thuế"
          className={oNhap}
        />
        <input
          name="phone"
          value={duLieu.phone}
          onChange={doiTruong}
          placeholder="Số điện thoại"
          aria-label="Số điện thoại"
          className={oNhap}
        />
        <input
          name="email"
          type="email"
          value={duLieu.email}
          onChange={doiTruong}
          placeholder="Email liên hệ"
          aria-label="Email liên hệ"
          className={oNhap}
        />
        <input
          name="address"
          value={duLieu.address}
          onChange={doiTruong}
          placeholder="Địa chỉ"
          aria-label="Địa chỉ"
          className={oNhap}
        />
        <input
          name="website"
          value={duLieu.website}
          onChange={doiTruong}
          placeholder="Website"
          aria-label="Website"
          className={oNhap}
        />
        <input
          name="logo"
          value={duLieu.logo}
          onChange={doiTruong}
          placeholder="Địa chỉ ảnh logo"
          aria-label="Địa chỉ ảnh logo"
          className={oNhap}
        />
        <input
          name="establishedYear"
          type="number"
          value={duLieu.establishedYear}
          onChange={doiTruong}
          placeholder="Năm thành lập"
          aria-label="Năm thành lập"
          className={oNhap}
        />
      </div>

      <textarea
        name="description"
        value={duLieu.description}
        onChange={doiTruong}
        placeholder="Mô tả ngắn về đơn vị (hiện trên thẻ giới thiệu ở trang chủ)"
        aria-label="Mô tả ngắn về đơn vị"
        rows={3}
        className={oNhap}
      />
      <input
        name="notableClients"
        value={duLieu.notableClients}
        onChange={doiTruong}
        placeholder="Khách hàng tiêu biểu"
        aria-label="Khách hàng tiêu biểu"
        className={oNhap}
      />

      <fieldset>
        <legend className="font-semibold text-gray-700 mb-2 text-sm">
          Lĩnh vực đào tạo (*)
        </legend>
        <div className="grid sm:grid-cols-2 gap-2">
          {PARTNER_CAPABILITIES.map((nl) => (
            <label key={nl} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                value={nl}
                checked={duLieu.capabilities.includes(nl)}
                onChange={doiNangLuc}
                className="rounded"
              />
              {nl}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-6 pt-2 border-t">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={duLieu.featured}
            onChange={(e) => setDuLieu((t) => ({ ...t, featured: e.target.checked }))}
            className="rounded"
          />
          Hiện trên trang chủ
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={duLieu.verified}
            onChange={(e) => setDuLieu((t) => ({ ...t, verified: e.target.checked }))}
            className="rounded"
          />
          Gắn nhãn đã xác minh
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Thứ tự
          <input
            name="displayOrder"
            type="number"
            value={duLieu.displayOrder}
            onChange={doiTruong}
            placeholder="1"
            aria-label="Thứ tự hiển thị"
            className="w-20 p-2 border border-gray-300 rounded"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={dangLuu}
        className="bg-gradient-to-r from-primary to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
      >
        <i className={`fas ${dangLuu ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
        {dangLuu ? 'Đang lưu...' : 'Thêm đối tác'}
      </button>
    </form>
  );
};

export default ThemDoiTacForm;
