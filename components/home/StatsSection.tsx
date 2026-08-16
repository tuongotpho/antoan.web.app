import React, { useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

/**
 * Khối số liệu ở trang chủ.
 *
 * TRƯỚC ĐÂY bốn con số "50+ đối tác · 200+ doanh nghiệp · 1000+ học viên ·
 * 98% hài lòng" được viết cứng trong mã. Chúng tự mâu thuẫn ngay trên cùng một
 * màn hình: khối "Đối tác uy tín" ngay bên dưới hiện "Đang cập nhật đối tác"
 * vì bảng partners chưa có bản ghi nào. Khách tinh ý nhận ra là mất lòng tin
 * vào mọi con số khác trên trang.
 *
 * NAY chỉ hiện những gì đếm được thật:
 *   - số bài viết đã đăng và số tài liệu: đếm thẳng từ Firestore
 *   - số lĩnh vực huấn luyện: đếm từ danh mục khoá học đang có trên trang
 *   - "Miễn phí": là chính sách thật, không phải số liệu thành tích
 *
 * Ô nào đếm ra 0 (hoặc không đọc được) thì tự ẩn — thà thiếu một ô còn hơn
 * trưng ra con số không có thật.
 *
 * Dùng getCountFromServer nên mỗi ô chỉ tốn 1 lượt đọc, không tải hết bản ghi.
 */

// Số lĩnh vực huấn luyện — khớp với danh mục trong CoursesSection.tsx
// (An toàn điện, xây dựng, hoá chất, PCCC, bức xạ, quan trắc môi trường,
// đánh giá phân loại lao động, sơ cấp cứu).
const SO_LINH_VUC = 8;

const StatCard: React.FC<{
    value: string;
    label: string;
    icon: string;
    gradient: string;
}> = ({ value, label, icon, gradient }) => (
    <div
        className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group`}
    >
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
        <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                    <i className={`fas ${icon} text-3xl text-white`}></i>
                </div>
            </div>
            <p className="text-4xl md:text-5xl font-extrabold text-white mb-2">{value}</p>
            <p className="text-sm md:text-base text-white/90 font-medium">{label}</p>
        </div>
    </div>
);

const StatsSection: React.FC = () => {
    const [soBaiViet, setSoBaiViet] = useState<number | null>(null);
    const [soTaiLieu, setSoTaiLieu] = useState<number | null>(null);

    useEffect(() => {
        let conHieuLuc = true;

        const dem = async () => {
            // Đếm bài viết đã đăng. Phải lọc published == true thì rules mới cho
            // đọc — truy vấn không lọc sẽ bị từ chối.
            try {
                const q = query(collection(db, 'blogPosts'), where('published', '==', true));
                const snap = await getCountFromServer(q);
                if (conHieuLuc) setSoBaiViet(snap.data().count);
            } catch (err) {
                console.error('Không đếm được số bài viết:', err);
            }

            try {
                const snap = await getCountFromServer(collection(db, 'documents'));
                if (conHieuLuc) setSoTaiLieu(snap.data().count);
            } catch (err) {
                console.error('Không đếm được số tài liệu:', err);
            }
        };

        dem();
        return () => {
            conHieuLuc = false;
        };
    }, []);

    const cacO = [
        {
            hien: true,
            value: String(SO_LINH_VUC),
            label: 'Lĩnh vực huấn luyện',
            icon: 'fa-helmet-safety',
            gradient: 'from-blue-500 to-blue-700',
        },
        {
            hien: soTaiLieu !== null && soTaiLieu > 0,
            value: String(soTaiLieu),
            label: 'Tài liệu pháp lý miễn phí',
            icon: 'fa-file-lines',
            gradient: 'from-green-500 to-green-700',
        },
        {
            hien: soBaiViet !== null && soBaiViet > 0,
            value: String(soBaiViet),
            label: 'Bài viết kiến thức',
            icon: 'fa-book-open',
            gradient: 'from-purple-500 to-purple-700',
        },
        {
            hien: true,
            value: '0đ',
            label: 'Chi phí cho doanh nghiệp gửi yêu cầu',
            icon: 'fa-hand-holding-heart',
            gradient: 'from-orange-500 to-orange-700',
        },
    ].filter((o) => o.hien);

    return (
        <section className="py-20 bg-gradient-to-b from-white via-gray-50 to-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-neutral-dark mb-3">
                        Nền tảng có gì
                    </h2>
                    <p className="text-gray-600">Cập nhật trực tiếp từ dữ liệu của hệ thống</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {cacO.map((o) => (
                        <StatCard
                            key={o.label}
                            value={o.value}
                            label={o.label}
                            icon={o.icon}
                            gradient={o.gradient}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatsSection;
