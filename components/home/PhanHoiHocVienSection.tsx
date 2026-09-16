import React, { useEffect, useState } from 'react';
import { db, doc, onSnapshot } from '../../services/firebaseConfig';
import { TIEU_CHI_PHAN_HOI, type ThongKeCongKhai } from '../../types';

/**
 * Khối "Học viên nói gì" ở trang chủ.
 *
 * Đọc MỘT tài liệu công khai `congKhai/phanHoiHocVien` do Cloud Function tổng
 * hợp từ phiếu nhận xét thật sau mỗi buổi giảng. Không đụng vào phiếu gốc
 * (rules chặn), không có họ tên.
 *
 * Chưa đủ 5 phiếu thì cả khối tự ẩn — "5,0 sao từ 1 phiếu" trông lố hơn là
 * không có gì, và cũng đúng tinh thần của StatsSection: chỉ trưng ra con số
 * đếm được thật.
 */

const Sao: React.FC<{ diem: number; nho?: boolean }> = ({ diem, nho }) => (
  <span className={`inline-flex gap-0.5 ${nho ? 'text-sm' : 'text-2xl'}`} aria-hidden="true">
    {[1, 2, 3, 4, 5].map((i) => {
      // Sao đầy, nửa, rỗng theo điểm trung bình (ví dụ 4,3 → 4 đầy + 1 rỗng; 4,6 → 4 đầy + nửa)
      const lech = diem - (i - 1);
      const lop = lech >= 0.75 ? 'fas fa-star' : lech >= 0.25 ? 'fas fa-star-half-stroke' : 'far fa-star';
      return <i key={i} className={`${lop} text-amber-400`}></i>;
    })}
  </span>
);

const PhanHoiHocVienSection: React.FC = () => {
  const [tk, setTk] = useState<ThongKeCongKhai | null>(null);

  useEffect(() => {
    const huy = onSnapshot(
      doc(db, 'congKhai', 'phanHoiHocVien'),
      (snap) => setTk(snap.exists() ? (snap.data() as ThongKeCongKhai) : null),
      (err) => console.error('Không đọc được số liệu phản hồi công khai:', err)
    );
    return huy;
  }, []);

  if (!tk || !tk.duDuLieu || tk.diemChung === null) return null;

  const ngayCapNhat = new Date(tk.capNhatLuc).toLocaleDateString('vi-VN');
  const tongPhanBo = tk.phanBoTongThe.reduce((a, b) => a + b, 0) || 1;

  return (
    <section className="py-20 bg-white" aria-labelledby="phan-hoi-hoc-vien">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 id="phan-hoi-hoc-vien" className="text-3xl md:text-4xl font-bold text-neutral-dark mb-3">
            Học viên nói gì sau buổi học
          </h2>
          <p className="text-gray-600">
            Tổng hợp từ phiếu nhận xét học viên gửi qua mã QR ngay cuối mỗi lớp · cập nhật {ngayCapNhat}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Điểm chung */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-amber-100 rounded-2xl p-8 text-center">
            <p className="text-6xl font-extrabold text-neutral-dark">
              {tk.diemChung.toFixed(1).replace('.', ',')}
              <span className="text-2xl text-gray-500 font-semibold">/5</span>
            </p>
            <div className="my-3">
              <Sao diem={tk.diemChung} />
            </div>
            <p className="text-gray-700 font-medium">
              {tk.soPhieu} phiếu nhận xét · {tk.soLop} lớp học
            </p>
            {tk.tiLeGioiThieu !== null && (
              <p className="mt-4 text-sm text-gray-600">
                <span className="text-2xl font-bold text-primary">{tk.tiLeGioiThieu}%</span>
                <br />
                sẽ giới thiệu khoá học cho đồng nghiệp
              </p>
            )}
          </div>

          {/* Phân bố sao */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h3 className="font-bold text-neutral-dark mb-4">Đánh giá chung</h3>
            <ul className="space-y-2">
              {[5, 4, 3, 2, 1].map((sao) => {
                const n = tk.phanBoTongThe[sao - 1];
                return (
                  <li key={sao} className="flex items-center gap-3 text-sm">
                    <span className="w-10 text-gray-700 whitespace-nowrap">
                      {sao} <i className="fas fa-star text-amber-400 text-xs" aria-hidden="true"></i>
                    </span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${(n / tongPhanBo) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-gray-500">{n}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Từng tiêu chí */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <h3 className="font-bold text-neutral-dark mb-4">Theo từng tiêu chí</h3>
            <ul className="space-y-3">
              {TIEU_CHI_PHAN_HOI.filter((tc) => tc.key !== 'tongThe').map((tc) => {
                const d = tk.diemTieuChi[tc.key];
                if (d === null || d === undefined) return null;
                return (
                  <li key={tc.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-700">{tc.label}</span>
                    <span className="whitespace-nowrap font-semibold text-neutral-dark">
                      {d.toFixed(1).replace('.', ',')} <Sao diem={d} nho />
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Câu nhận xét đã duyệt */}
        {tk.nhanXetNoiBat.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tk.nhanXetNoiBat.map((nx) => (
              <blockquote
                key={nx.id}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col"
              >
                <div className="mb-3">
                  <Sao diem={nx.diem} nho />
                </div>
                <p className="text-gray-800 flex-1">“{nx.noiDung}”</p>
                <footer className="mt-4 text-sm text-gray-500">— {nx.nguoi}</footer>
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PhanHoiHocVienSection;
