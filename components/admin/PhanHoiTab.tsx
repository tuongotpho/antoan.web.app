import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  db,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type User,
} from '../../services/firebaseConfig';
import {
  TIEU_CHI_PHAN_HOI,
  VI_TRI_HOC_VIEN,
  type Feedback,
  type FeedbackSession,
} from '../../types';
import { sinhMaLop, thongKePhanHoi, xuatCsvPhanHoi } from '../../utils/phanHoi';

/**
 * Tab "Phản hồi" trong trang quản trị: tạo lớp → lấy QR → xem kết quả.
 *
 * Toàn bộ bài nhận xét được nạp một lần rồi gộp theo lớp ngay trên máy —
 * vài trăm bài mỗi năm, không đáng để truy vấn riêng từng lớp (và khỏi cần
 * thêm chỉ mục Firestore).
 */

interface PhanHoiTabProps {
  user: User;
}

const inputClasses =
  'w-full p-3 border border-gray-300 rounded-lg bg-white text-neutral-dark focus:ring-2 focus:ring-primary placeholder-gray-500';

const homNay = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const dinhDangNgay = (ymd: string): string => {
  const [y, m, d] = ymd.split('-');
  return y && m && d ? `${d}/${m}/${y}` : ymd;
};

const duongLinkLop = (id: string) => `${window.location.origin}/danh-gia/${id}`;

const nhanViTri = (key: string) => VI_TRI_HOC_VIEN.find((v) => v.key === key)?.label ?? key;

const PhanHoiTab: React.FC<PhanHoiTabProps> = ({ user }) => {
  const [lops, setLops] = useState<FeedbackSession[]>([]);
  const [baiNhanXet, setBaiNhanXet] = useState<Feedback[]>([]);
  const [loiTai, setLoiTai] = useState('');
  const [loiThaoTac, setLoiThaoTac] = useState('');

  const [dangTaoLop, setDangTaoLop] = useState(false);
  const [formLop, setFormLop] = useState({
    tenKhoa: '',
    ngayGiang: homNay(),
    donVi: '',
    giangVien: '',
    ghiChu: '',
  });
  const [dangLuu, setDangLuu] = useState(false);

  const [lopDangChon, setLopDangChon] = useState<string | null>(null);
  const [anhQr, setAnhQr] = useState<string>('');
  const [daChepLink, setDaChepLink] = useState(false);

  // Nạp danh sách lớp và toàn bộ bài nhận xét
  useEffect(() => {
    setLoiTai('');
    const huyLop = onSnapshot(
      query(collection(db, 'feedbackSessions'), orderBy('createdAt', 'desc')),
      (snap) => setLops(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FeedbackSession)),
      (err) => {
        console.error('Không tải được danh sách lớp:', err);
        setLoiTai('Không tải được danh sách lớp: ' + err.message);
      }
    );
    const huyBai = onSnapshot(
      collection(db, 'feedbacks'),
      (snap) => setBaiNhanXet(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Feedback)),
      (err) => {
        console.error('Không tải được bài nhận xét:', err);
        setLoiTai('Không tải được bài nhận xét: ' + err.message);
      }
    );
    return () => {
      huyLop();
      huyBai();
    };
  }, []);

  // Gộp bài theo lớp, mới nhất lên đầu
  const baiTheoLop = useMemo(() => {
    const m = new Map<string, Feedback[]>();
    for (const fb of baiNhanXet) {
      const ds = m.get(fb.sessionId) ?? [];
      ds.push(fb);
      m.set(fb.sessionId, ds);
    }
    for (const ds of m.values()) {
      ds.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
    }
    return m;
  }, [baiNhanXet]);

  const lop = lops.find((l) => l.id === lopDangChon) ?? null;
  const baiCuaLop = useMemo(
    () => (lop ? (baiTheoLop.get(lop.id) ?? []) : []),
    [lop, baiTheoLop]
  );
  const thongKe = useMemo(() => thongKePhanHoi(baiCuaLop), [baiCuaLop]);

  // Vẽ QR khi chọn lớp. Sinh ngay trên máy, không gọi dịch vụ ngoài (CSP chặn).
  useEffect(() => {
    if (!lop) {
      setAnhQr('');
      return;
    }
    let huy = false;
    QRCode.toDataURL(duongLinkLop(lop.id), {
      width: 640,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#111827', light: '#ffffff' },
    })
      .then((url) => {
        if (!huy) setAnhQr(url);
      })
      .catch((err) => {
        console.error('Không sinh được QR:', err);
        if (!huy) setLoiThaoTac('Không sinh được mã QR: ' + (err as Error).message);
      });
    return () => {
      huy = true;
    };
  }, [lop]);

  const taoLop = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoiThaoTac('');
    if (!formLop.tenKhoa.trim()) {
      setLoiThaoTac('Cần nhập tên khoá / chủ đề buổi giảng.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formLop.ngayGiang)) {
      setLoiThaoTac('Ngày giảng chưa đúng.');
      return;
    }
    setDangLuu(true);
    try {
      // Sinh mã, kiểm trùng tối đa 5 lần (xác suất trùng trong ngày ~0,1%)
      let ma = '';
      for (let i = 0; i < 5; i++) {
        const thu = sinhMaLop(formLop.ngayGiang);
        const snap = await getDoc(doc(db, 'feedbackSessions', thu));
        if (!snap.exists()) {
          ma = thu;
          break;
        }
      }
      if (!ma) throw new Error('Không sinh được mã lớp không trùng, thử lại.');

      await setDoc(doc(db, 'feedbackSessions', ma), {
        tenKhoa: formLop.tenKhoa.trim(),
        ngayGiang: formLop.ngayGiang,
        donVi: formLop.donVi.trim(),
        giangVien: formLop.giangVien.trim(),
        ghiChu: formLop.ghiChu.trim(),
        status: 'open',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      setFormLop({ tenKhoa: '', ngayGiang: homNay(), donVi: '', giangVien: '', ghiChu: '' });
      setDangTaoLop(false);
      setLopDangChon(ma);
    } catch (err) {
      console.error('Tạo lớp thất bại:', err);
      setLoiThaoTac('Tạo lớp thất bại: ' + (err as Error).message);
    } finally {
      setDangLuu(false);
    }
  };

  const doiTrangThai = async (l: FeedbackSession) => {
    setLoiThaoTac('');
    try {
      await updateDoc(doc(db, 'feedbackSessions', l.id), {
        status: l.status === 'open' ? 'closed' : 'open',
      });
    } catch (err) {
      setLoiThaoTac('Không đổi được trạng thái: ' + (err as Error).message);
    }
  };

  const xoaLop = async (l: FeedbackSession) => {
    const soBai = baiTheoLop.get(l.id)?.length ?? 0;
    const hoi =
      soBai > 0
        ? `Xoá lớp "${l.tenKhoa}" và ${soBai} bài nhận xét đi kèm? Không khôi phục được.`
        : `Xoá lớp "${l.tenKhoa}"?`;
    if (!window.confirm(hoi)) return;
    setLoiThaoTac('');
    try {
      for (const fb of baiTheoLop.get(l.id) ?? []) {
        await deleteDoc(doc(db, 'feedbacks', fb.id));
      }
      await deleteDoc(doc(db, 'feedbackSessions', l.id));
      if (lopDangChon === l.id) setLopDangChon(null);
    } catch (err) {
      setLoiThaoTac('Xoá thất bại: ' + (err as Error).message);
    }
  };

  // Chọn câu nhận xét đưa lên trang chủ. Chỉ đổi đúng một cờ — rules chặn mọi
  // trường khác. Cloud Function thấy phiếu đổi sẽ tự tính lại số liệu công khai.
  const doiHienTrangChu = async (fb: Feedback) => {
    setLoiThaoTac('');
    try {
      await updateDoc(doc(db, 'feedbacks', fb.id), { hienTrangChu: !fb.hienTrangChu });
    } catch (err) {
      setLoiThaoTac('Không đổi được cờ hiện trang chủ: ' + (err as Error).message);
    }
  };

  const chepLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(duongLinkLop(id));
      setDaChepLink(true);
      setTimeout(() => setDaChepLink(false), 2000);
    } catch {
      setLoiThaoTac('Trình duyệt không cho sao chép tự động — anh/chị bôi đen link rồi Ctrl+C.');
    }
  };

  const taiCsv = () => {
    if (!lop) return;
    const blob = new Blob([xuatCsvPhanHoi(baiCuaLop)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phan-hoi-${lop.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {loiTai && (
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-900 p-4 rounded-md" role="alert">
          {loiTai}
        </div>
      )}
      {loiThaoTac && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-md relative" role="alert">
          {loiThaoTac}
          <button
            onClick={() => setLoiThaoTac('')}
            className="absolute top-0 bottom-0 right-0 px-4"
            aria-label="Đóng"
          >
            &times;
          </button>
        </div>
      )}

      {/* Tạo lớp */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-dark">
              <i className="fas fa-qrcode mr-2" aria-hidden="true"></i>Lớp học & mã QR nhận xét
            </h2>
            <p className="text-sm text-gray-600">
              Mỗi buổi giảng tạo một lớp, lấy QR dán vào slide cuối. Học viên quét là điền được, không
              cần đăng nhập.
            </p>
          </div>
          <button
            onClick={() => setDangTaoLop((v) => !v)}
            className="bg-primary text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-all"
          >
            <i className={`fas ${dangTaoLop ? 'fa-xmark' : 'fa-plus'} mr-2`} aria-hidden="true"></i>
            {dangTaoLop ? 'Đóng' : 'Tạo lớp mới'}
          </button>
        </div>

        {dangTaoLop && (
          <form onSubmit={taoLop} className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="tenKhoa" className="block text-sm font-medium text-gray-700 mb-1">
                Tên khoá / chủ đề <span className="text-red-600">*</span>
              </label>
              <input
                id="tenKhoa"
                className={inputClasses}
                placeholder="Ví dụ: Huấn luyện an toàn điện nhóm 3 — Đội QLVH 2"
                value={formLop.tenKhoa}
                onChange={(e) => setFormLop((f) => ({ ...f, tenKhoa: e.target.value }))}
                maxLength={200}
                required
              />
            </div>
            <div>
              <label htmlFor="ngayGiang" className="block text-sm font-medium text-gray-700 mb-1">
                Ngày giảng <span className="text-red-600">*</span>
              </label>
              <input
                id="ngayGiang"
                type="date"
                className={inputClasses}
                value={formLop.ngayGiang}
                onChange={(e) => setFormLop((f) => ({ ...f, ngayGiang: e.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="giangVien" className="block text-sm font-medium text-gray-700 mb-1">
                Giảng viên
              </label>
              <input
                id="giangVien"
                className={inputClasses}
                value={formLop.giangVien}
                onChange={(e) => setFormLop((f) => ({ ...f, giangVien: e.target.value }))}
                maxLength={100}
              />
            </div>
            <div>
              <label htmlFor="donViLop" className="block text-sm font-medium text-gray-700 mb-1">
                Đơn vị học viên
              </label>
              <input
                id="donViLop"
                className={inputClasses}
                value={formLop.donVi}
                onChange={(e) => setFormLop((f) => ({ ...f, donVi: e.target.value }))}
                maxLength={200}
              />
            </div>
            <div>
              <label htmlFor="ghiChu" className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú (chỉ mình thấy)
              </label>
              <input
                id="ghiChu"
                className={inputClasses}
                value={formLop.ghiChu}
                onChange={(e) => setFormLop((f) => ({ ...f, ghiChu: e.target.value }))}
                maxLength={500}
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={dangLuu}
                className="bg-primary text-white font-bold px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-75 disabled:cursor-wait"
              >
                {dangLuu ? 'Đang tạo...' : 'Tạo lớp và lấy mã QR'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Danh sách lớp */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {lops.length === 0 ? (
          <p className="p-8 text-center text-gray-500">Chưa có lớp nào. Bấm "Tạo lớp mới" để bắt đầu.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="p-3">Mã</th>
                  <th className="p-3">Khoá học</th>
                  <th className="p-3">Ngày</th>
                  <th className="p-3 text-center">Bài</th>
                  <th className="p-3 text-center">Điểm chung</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {lops.map((l) => {
                  const ds = baiTheoLop.get(l.id) ?? [];
                  const tk = thongKePhanHoi(ds);
                  const diemChung = tk.tieuChi.find((t) => t.key === 'tongThe')?.trungBinh;
                  const dangChon = l.id === lopDangChon;
                  return (
                    <tr
                      key={l.id}
                      className={`border-t border-gray-100 ${dangChon ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="p-3 font-mono font-bold">{l.id}</td>
                      <td className="p-3">
                        <div className="font-medium text-neutral-dark">{l.tenKhoa}</div>
                        {(l.donVi || l.giangVien) && (
                          <div className="text-xs text-gray-500">
                            {[l.donVi, l.giangVien].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">{dinhDangNgay(l.ngayGiang)}</td>
                      <td className="p-3 text-center">{ds.length}</td>
                      <td className="p-3 text-center">
                        {diemChung !== null && diemChung !== undefined ? (
                          <span className="font-semibold text-amber-600">
                            {diemChung.toFixed(1)} <i className="fas fa-star text-xs" aria-hidden="true"></i>
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            l.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {l.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => setLopDangChon(dangChon ? null : l.id)}
                          className="text-primary font-semibold hover:underline mr-3"
                        >
                          {dangChon ? 'Thu gọn' : 'QR & kết quả'}
                        </button>
                        <button
                          onClick={() => doiTrangThai(l)}
                          className="text-gray-600 hover:underline mr-3"
                          title={l.status === 'open' ? 'Ngừng nhận bài' : 'Mở lại nhận bài'}
                        >
                          {l.status === 'open' ? 'Đóng' : 'Mở lại'}
                        </button>
                        <button
                          onClick={() => xoaLop(l)}
                          className="text-red-600 hover:underline"
                          aria-label={`Xoá lớp ${l.id}`}
                        >
                          Xoá
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chi tiết lớp đang chọn */}
      {lop && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 text-center">
            <h3 className="font-bold text-neutral-dark mb-1">Mã QR lớp {lop.id}</h3>
            <p className="text-xs text-gray-500 mb-3">Dán vào slide cuối hoặc in giấy A4</p>
            {anhQr ? (
              <img
                src={anhQr}
                alt={`Mã QR mở phiếu nhận xét lớp ${lop.id}`}
                className="mx-auto w-full max-w-[260px] border border-gray-200 rounded-lg"
              />
            ) : (
              <div className="mx-auto w-[260px] h-[260px] bg-gray-100 rounded-lg animate-pulse" />
            )}
            <p className="mt-3 text-sm break-all">
              <a
                href={duongLinkLop(lop.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {duongLinkLop(lop.id)}
              </a>
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {anhQr && (
                <a
                  href={anhQr}
                  download={`qr-${lop.id}.png`}
                  className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark"
                >
                  <i className="fas fa-download mr-1" aria-hidden="true"></i> Tải ảnh QR
                </a>
              )}
              <button
                onClick={() => chepLink(lop.id)}
                className="bg-gray-100 text-gray-800 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                <i className={`fas ${daChepLink ? 'fa-check' : 'fa-link'} mr-1`} aria-hidden="true"></i>
                {daChepLink ? 'Đã chép' : 'Chép link'}
              </button>
            </div>
            {lop.status === 'closed' && (
              <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded p-2">
                Lớp đang đóng — quét QR sẽ thấy thông báo "đã đóng nhận xét".
              </p>
            )}
          </div>

          {/* Thống kê */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="font-bold text-neutral-dark">
                  Kết quả: {thongKe.soBai} bài
                  {thongKe.tiLeGioiThieu !== null && (
                    <span className="ml-3 text-sm font-normal text-gray-600">
                      · {Math.round(thongKe.tiLeGioiThieu * 100)}% sẽ giới thiệu cho đồng nghiệp
                    </span>
                  )}
                </h3>
                <button
                  onClick={taiCsv}
                  disabled={thongKe.soBai === 0}
                  className="bg-gray-100 text-gray-800 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  <i className="fas fa-file-csv mr-1" aria-hidden="true"></i> Xuất Excel (CSV)
                </button>
              </div>
              {thongKe.soBai === 0 ? (
                <p className="text-gray-500 text-sm">Chưa có bài nào. Học viên quét QR gửi xong là hiện ở đây ngay.</p>
              ) : (
                <ul className="space-y-3">
                  {thongKe.tieuChi.map((tc) => (
                    <li key={tc.key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700">{tc.label}</span>
                        <span className="font-bold text-amber-600 whitespace-nowrap ml-3">
                          {tc.trungBinh?.toFixed(1) ?? '—'} <i className="fas fa-star text-xs" aria-hidden="true"></i>
                        </span>
                      </div>
                      {/* Thanh phân bố 1..5 sao */}
                      <div
                        className="flex h-2 rounded-full overflow-hidden bg-gray-100"
                        title={tc.phanBo.map((n, i) => `${i + 1}★: ${n}`).join(' · ')}
                      >
                        {tc.phanBo.map((n, i) => (
                          <div
                            key={i}
                            style={{ width: `${(n / thongKe.soBai) * 100}%` }}
                            className={['bg-red-400', 'bg-orange-300', 'bg-yellow-300', 'bg-lime-400', 'bg-green-500'][i]}
                          />
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Danh sách bài */}
            {baiCuaLop.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100">
                <p className="p-4 text-xs text-gray-500 bg-gray-50 rounded-t-xl">
                  Điểm trung bình và số phiếu tự động lên trang chủ khi đủ 5 phiếu. Câu nhận xét thì
                  anh/chị chọn tay bằng nút "Hiện ở trang chủ" — họ tên luôn được ẩn.
                </p>
                {baiCuaLop.map((fb) => (
                  <article key={fb.id} className="p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <span className="font-semibold text-neutral-dark">
                          {fb.hoTen || <span className="italic text-gray-500">Ẩn danh</span>}
                        </span>
                        <span className="text-sm text-gray-600"> · {fb.donVi} · {nhanViTri(fb.viTri)}</span>
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {fb.createdAt?.toDate?.().toLocaleString('vi-VN') ?? ''}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                      {TIEU_CHI_PHAN_HOI.map((tc) => (
                        <span key={tc.key}>
                          {tc.label.split(' ').slice(0, 2).join(' ')}: <b>{fb.ratings?.[tc.key] ?? '—'}</b>
                        </span>
                      ))}
                      <span>
                        Giới thiệu: <b>{fb.gioiThieu ? 'Có' : 'Không'}</b>
                      </span>
                    </div>
                    {fb.huuIch && (
                      <p className="mt-2 text-sm">
                        <span className="text-gray-500">Hữu ích nhất:</span> {fb.huuIch}
                      </p>
                    )}
                    {fb.gopY && (
                      <p className="mt-1 text-sm">
                        <span className="text-gray-500">Góp ý:</span> {fb.gopY}
                      </p>
                    )}
                    {(fb.huuIch || fb.gopY) && (
                      <button
                        onClick={() => doiHienTrangChu(fb)}
                        aria-pressed={fb.hienTrangChu === true}
                        className={`mt-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                          fb.hienTrangChu
                            ? 'bg-green-100 border-green-300 text-green-800'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                        title="Đưa câu nhận xét này lên trang chủ (ẩn họ tên, chỉ ghi vị trí và đơn vị)"
                      >
                        <i className={`fas ${fb.hienTrangChu ? 'fa-eye' : 'fa-eye-slash'} mr-1`} aria-hidden="true"></i>
                        {fb.hienTrangChu ? 'Đang hiện ở trang chủ' : 'Hiện ở trang chủ'}
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhanHoiTab;
