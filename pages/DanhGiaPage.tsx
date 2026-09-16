import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, doc, getDoc, collection, addDoc, serverTimestamp } from '../services/firebaseConfig';
import { TIEU_CHI_PHAN_HOI, VI_TRI_HOC_VIEN, type FeedbackSession, type TieuChiKey } from '../types';
import {
  GIOI_HAN,
  LINK_DANH_GIA_GOOGLE,
  DIEM_TOI_THIEU_MOI_GOOGLE,
  kiemTraPhanHoi,
  laMaLopHopLe,
  type DuLieuFormPhanHoi,
} from '../utils/phanHoi';
import ChamSao from '../components/ChamSao';
import SEOHead from '../components/SEOHead';

/**
 * Trang học viên điền nhận xét sau buổi giảng: /danh-gia/:maLop
 *
 * Mở từ mã QR trên slide cuối buổi học. KHÔNG cần đăng nhập — bắt học viên
 * đăng nhập Google trên điện thoại là mất già nửa số người điền.
 * Thiết kế cho màn hình điện thoại trước.
 */

type TrangThai = 'dang-tai' | 'khong-co' | 'da-dong' | 'dien' | 'dang-gui' | 'da-gui';

const inputClasses =
  'w-full p-3 border border-gray-300 rounded-lg bg-white text-neutral-dark focus:ring-2 focus:ring-primary placeholder-gray-500';

const khoaDaGui = (ma: string) => `phanhoi_dagui_${ma}`;

const DanhGiaPage: React.FC = () => {
  const { maLop = '' } = useParams<{ maLop: string }>();
  const ma = maLop.toUpperCase();

  const [trangThai, setTrangThai] = useState<TrangThai>('dang-tai');
  const [lop, setLop] = useState<FeedbackSession | null>(null);
  const [loi, setLoi] = useState<string[]>([]);
  const [daGuiTruoc, setDaGuiTruoc] = useState(false);

  const [form, setForm] = useState<DuLieuFormPhanHoi>({
    hoTen: '',
    donVi: '',
    viTri: '',
    ratings: {},
    huuIch: '',
    gopY: '',
    gioiThieu: null,
  });
  // Ô bẫy: người thật không thấy, bot điền tự động thì thấy. Có chữ trong đây
  // thì lặng lẽ bỏ qua, không ghi.
  const [oBay, setOBay] = useState('');

  useEffect(() => {
    let huy = false;
    const tai = async () => {
      if (!laMaLopHopLe(ma)) {
        setTrangThai('khong-co');
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'feedbackSessions', ma));
        if (huy) return;
        if (!snap.exists()) {
          setTrangThai('khong-co');
          return;
        }
        const data = { id: snap.id, ...snap.data() } as FeedbackSession;
        setLop(data);
        setTrangThai(data.status === 'open' ? 'dien' : 'da-dong');
        try {
          setDaGuiTruoc(localStorage.getItem(khoaDaGui(ma)) === '1');
        } catch {
          /* trình duyệt chặn localStorage thì thôi, không sao */
        }
      } catch (err) {
        console.error('Không tải được lớp:', err);
        if (!huy) setTrangThai('khong-co');
      }
    };
    tai();
    return () => {
      huy = true;
    };
  }, [ma]);

  const datDiem = (key: TieuChiKey, diem: number) =>
    setForm((f) => ({ ...f, ratings: { ...f.ratings, [key]: diem } }));

  const guiBai = async (e: React.FormEvent) => {
    e.preventDefault();
    const danhSachLoi = kiemTraPhanHoi(form);
    setLoi(danhSachLoi);
    if (danhSachLoi.length) {
      document.getElementById('loi-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (oBay.trim()) {
      // Bot: giả vờ thành công cho nó đi chỗ khác.
      setTrangThai('da-gui');
      return;
    }

    setTrangThai('dang-gui');
    try {
      await addDoc(collection(db, 'feedbacks'), {
        sessionId: ma,
        hoTen: form.hoTen.trim(),
        donVi: form.donVi.trim(),
        viTri: form.viTri,
        ratings: form.ratings,
        huuIch: form.huuIch.trim(),
        gopY: form.gopY.trim(),
        gioiThieu: form.gioiThieu === true,
        createdAt: serverTimestamp(),
      });
      try {
        localStorage.setItem(khoaDaGui(ma), '1');
      } catch {
        /* bỏ qua */
      }
      setTrangThai('da-gui');
    } catch (err) {
      console.error('Gửi nhận xét thất bại:', err);
      setLoi([
        'Không gửi được. Có thể lớp vừa đóng nhận xét hoặc mất mạng — anh/chị thử lại, nếu vẫn lỗi thì báo giảng viên.',
      ]);
      setTrangThai('dien');
    }
  };

  const khungThongBao = (icon: string, mau: string, tieuDe: string, noiDung: React.ReactNode) => (
    <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
      <div className={`w-16 h-16 mx-auto mb-5 rounded-full ${mau} flex items-center justify-center`}>
        <i className={`fas ${icon} text-2xl`} aria-hidden="true"></i>
      </div>
      <h1 className="text-xl font-bold text-neutral-dark mb-3">{tieuDe}</h1>
      <div className="text-gray-600">{noiDung}</div>
    </div>
  );

  let noiDung: React.ReactNode;

  if (trangThai === 'dang-tai') {
    noiDung = <div className="text-center p-10 text-gray-600">Đang mở phiếu nhận xét...</div>;
  } else if (trangThai === 'khong-co') {
    noiDung = khungThongBao(
      'fa-circle-question',
      'bg-amber-50 text-amber-600',
      'Không tìm thấy lớp học',
      <p>
        Mã lớp <code className="font-mono font-bold">{ma || '(trống)'}</code> không đúng hoặc đã bị
        xoá. Anh/chị kiểm tra lại mã QR hoặc hỏi giảng viên.
      </p>
    );
  } else if (trangThai === 'da-dong') {
    noiDung = khungThongBao(
      'fa-lock',
      'bg-gray-100 text-gray-500',
      'Lớp đã đóng nhận xét',
      <p>
        Lớp <strong>{lop?.tenKhoa}</strong> không nhận thêm phiếu nữa. Cảm ơn anh/chị đã quan tâm.
      </p>
    );
  } else if (trangThai === 'da-gui') {
    noiDung = khungThongBao(
      'fa-circle-check',
      'bg-green-50 text-green-600',
      'Đã nhận được nhận xét',
      <>
        <p>Cảm ơn anh/chị đã dành thời gian góp ý. Ý kiến này giúp buổi giảng sau tốt hơn.</p>
        {/* Người vừa hài lòng, đang cầm điện thoại: mời họ để lại đánh giá trên Google
            luôn — một bấm là xong. Chỉ hiện khi đã cấu hình link và điểm chung ≥ 4. */}
        {LINK_DANH_GIA_GOOGLE && (form.ratings.tongThe ?? 0) >= DIEM_TOI_THIEU_MOI_GOOGLE && (
          <a
            href={LINK_DANH_GIA_GOOGLE}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-dark"
          >
            <i className="fab fa-google" aria-hidden="true"></i>
            Đánh giá giảng viên trên Google Maps
          </a>
        )}
        <p className="mt-4 text-sm">
          <Link to="/documents" className="text-primary font-semibold hover:underline">
            Xem tài liệu an toàn lao động
          </Link>
        </p>
      </>
    );
  } else {
    const dangGui = trangThai === 'dang-gui';
    noiDung = (
      <form onSubmit={guiBai} className="max-w-lg mx-auto space-y-6" noValidate>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Phiếu nhận xét buổi giảng</p>
          <h1 className="text-xl font-bold text-neutral-dark">{lop?.tenKhoa}</h1>
          <p className="text-gray-600 mt-1 text-sm">
            {lop?.ngayGiang && <>Ngày {dinhDangNgay(lop.ngayGiang)}</>}
            {lop?.giangVien && <> · Giảng viên: {lop.giangVien}</>}
            {lop?.donVi && <> · {lop.donVi}</>}
          </p>
          <p className="text-sm text-gray-600 mt-3">
            Mất khoảng 2 phút. Có thể để trống họ tên. Thông tin anh/chị điền chỉ giảng viên xem, dùng
            để cải thiện buổi giảng, không chia sẻ cho bên khác.
          </p>
          {daGuiTruoc && (
            <p className="mt-3 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3">
              Máy này đã gửi một phiếu cho lớp này rồi. Nếu là người khác dùng chung điện thoại thì cứ
              điền tiếp.
            </p>
          )}
        </div>

        {/* Thông tin chung */}
        <fieldset className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <legend className="sr-only">Thông tin chung</legend>
          <h2 className="font-bold text-neutral-dark">1. Thông tin chung</h2>
          <div>
            <label htmlFor="hoTen" className="block text-sm font-medium text-gray-700 mb-1">
              Họ tên <span className="text-gray-500 font-normal">(không bắt buộc)</span>
            </label>
            <input
              id="hoTen"
              type="text"
              autoComplete="name"
              maxLength={GIOI_HAN.hoTen}
              value={form.hoTen}
              onChange={(e) => setForm((f) => ({ ...f, hoTen: e.target.value }))}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="donVi" className="block text-sm font-medium text-gray-700 mb-1">
              Đơn vị / bộ phận <span className="text-red-600">*</span>
            </label>
            <input
              id="donVi"
              type="text"
              autoComplete="organization"
              maxLength={GIOI_HAN.donVi}
              placeholder="Ví dụ: Đội QLVH đường dây 2"
              value={form.donVi}
              onChange={(e) => setForm((f) => ({ ...f, donVi: e.target.value }))}
              className={inputClasses}
              required
            />
          </div>
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Vị trí công việc <span className="text-red-600">*</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VI_TRI_HOC_VIEN.map((v) => (
                <label
                  key={v.key}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                    form.viTri === v.key ? 'border-primary bg-orange-50' : 'border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="viTri"
                    value={v.key}
                    checked={form.viTri === v.key}
                    onChange={() => setForm((f) => ({ ...f, viTri: v.key }))}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-sm">{v.label}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Ô bẫy bot — ẩn hoàn toàn với người thật */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={oBay}
              onChange={(e) => setOBay(e.target.value)}
            />
          </div>
        </fieldset>

        {/* Chấm điểm */}
        <fieldset className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-5">
          <legend className="sr-only">Chấm điểm</legend>
          <h2 className="font-bold text-neutral-dark">
            2. Chấm điểm <span className="text-sm font-normal text-gray-500">(1 sao = rất kém, 5 sao = rất tốt)</span>
          </h2>
          {TIEU_CHI_PHAN_HOI.map((tc) => (
            <div key={tc.key}>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {tc.label} <span className="text-red-600">*</span>
              </p>
              <ChamSao ten={tc.label} giaTri={form.ratings[tc.key]} onChange={(d) => datDiem(tc.key, d)} />
            </div>
          ))}
        </fieldset>

        {/* Câu hỏi mở */}
        <fieldset className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
          <legend className="sr-only">Nhận xét</legend>
          <h2 className="font-bold text-neutral-dark">3. Nhận xét thêm</h2>
          <div>
            <label htmlFor="huuIch" className="block text-sm font-medium text-gray-700 mb-1">
              Điều gì hữu ích nhất với công việc của anh/chị?
            </label>
            <textarea
              id="huuIch"
              rows={3}
              maxLength={GIOI_HAN.vanBan}
              value={form.huuIch}
              onChange={(e) => setForm((f) => ({ ...f, huuIch: e.target.value }))}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="gopY" className="block text-sm font-medium text-gray-700 mb-1">
              Cần bổ sung hoặc thay đổi gì cho buổi sau?
            </label>
            <textarea
              id="gopY"
              rows={3}
              maxLength={GIOI_HAN.vanBan}
              value={form.gopY}
              onChange={(e) => setForm((f) => ({ ...f, gopY: e.target.value }))}
              className={inputClasses}
            />
          </div>
          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Anh/chị có muốn giới thiệu khoá này cho đồng nghiệp không?{' '}
              <span className="text-red-600">*</span>
            </p>
            <div className="flex gap-3">
              {[
                { gt: true, nhan: 'Có', icon: 'fa-thumbs-up' },
                { gt: false, nhan: 'Không', icon: 'fa-thumbs-down' },
              ].map((o) => (
                <button
                  key={o.nhan}
                  type="button"
                  aria-pressed={form.gioiThieu === o.gt}
                  onClick={() => setForm((f) => ({ ...f, gioiThieu: o.gt }))}
                  className={`flex-1 p-3 border rounded-lg font-semibold transition-colors ${
                    form.gioiThieu === o.gt
                      ? 'border-primary bg-orange-50 text-primary'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className={`fas ${o.icon} mr-2`} aria-hidden="true"></i>
                  {o.nhan}
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        {loi.length > 0 && (
          <div
            id="loi-form"
            role="alert"
            className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-md"
          >
            <p className="font-bold mb-1">Chưa gửi được, còn thiếu:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {loi.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={dangGui}
          className="w-full flex justify-center items-center bg-primary text-white font-bold py-3 rounded-lg hover:opacity-90 transition duration-300 disabled:opacity-75 disabled:cursor-wait"
        >
          {dangGui ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2" aria-hidden="true"></i>Đang gửi...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane mr-2" aria-hidden="true"></i>Gửi nhận xét
            </>
          )}
        </button>
      </form>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <SEOHead
        title="Phiếu nhận xét buổi giảng | SafetyConnect"
        description="Phiếu nhận xét dành cho học viên sau buổi huấn luyện an toàn."
        noindex
      />
      {noiDung}
    </div>
  );
};

/** '2026-09-16' → '16/09/2026'. Không parse Date để khỏi lệch múi giờ. */
const dinhDangNgay = (ymd: string): string => {
  const [y, m, d] = ymd.split('-');
  return y && m && d ? `${d}/${m}/${y}` : ymd;
};

export default DanhGiaPage;
