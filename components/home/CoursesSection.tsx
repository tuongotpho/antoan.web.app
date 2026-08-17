import React from 'react';
import { useNavigate } from 'react-router-dom';

const CourseCard: React.FC<{
    icon: string;
    title: string;
    onClick?: () => void;
    gradient: string;
}> = ({ icon, title, onClick, gradient }) => (
    <div
        onClick={onClick}
        className="relative bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg border border-gray-100 text-center transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl cursor-pointer group overflow-hidden"
    >
        <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        ></div>
        <div className="relative z-10">
            <div
                className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
            >
                <i className={`fas ${icon} text-4xl text-white`}></i>
            </div>
            {/* h3 chứ không phải h4: mục cha của khối này là h2 "Các khóa đào
                tạo phổ biến". Nhảy thẳng từ h2 xuống h4 làm mục lục của trang
                khuyết một cấp — người dùng trình đọc màn hình thường nhảy giữa
                các tiêu đề để lướt trang, gặp chỗ khuyết là mất mạch. */}
            <h3 className="font-bold text-neutral-dark group-hover:text-white transition-colors text-lg mb-2">
                {title}
            </h3>
            <p className="text-xs text-gray-500 group-hover:text-white/90 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <i className="fas fa-arrow-right mr-1"></i>Xem chi tiết
            </p>
        </div>
    </div>
);

const CoursesSection: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <div className="inline-block bg-gradient-to-r from-primary to-orange-600 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
                        KHÓA HỌC
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-neutral-dark mb-4">
                        Các khóa đào tạo phổ biến
                    </h2>
                    <p className="text-gray-600 text-lg">Nhấn vào từng khóa để xem thông tin chi tiết</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                    <CourseCard
                        icon="fa-bolt"
                        title="An toàn Điện"
                        onClick={() => navigate('/training/an-toan-dien')}
                        gradient="from-yellow-500 to-yellow-700"
                    />
                    <CourseCard
                        icon="fa-hard-hat"
                        title="An toàn Xây dựng"
                        onClick={() => navigate('/training/an-toan-xay-dung')}
                        gradient="from-orange-500 to-orange-700"
                    />
                    <CourseCard
                        icon="fa-flask"
                        title="An toàn Hóa chất"
                        onClick={() => navigate('/training/an-toan-hoa-chat')}
                        gradient="from-purple-500 to-purple-700"
                    />
                    <CourseCard
                        icon="fa-fire-extinguisher"
                        title="PCCC"
                        onClick={() => navigate('/training/pccc')}
                        gradient="from-red-500 to-red-700"
                    />
                    <CourseCard
                        icon="fa-radiation-alt"
                        title="An toàn Bức xạ"
                        onClick={() => navigate('/training/an-toan-buc-xa')}
                        gradient="from-cyan-500 to-cyan-700"
                    />
                    <CourseCard
                        icon="fa-leaf"
                        title="Quan trắc Môi trường"
                        onClick={() => navigate('/training/quan-trac-moi-truong')}
                        gradient="from-green-500 to-green-700"
                    />
                    <CourseCard
                        icon="fa-clipboard-check"
                        title="Đánh giá Phân loại Lao động"
                        onClick={() => navigate('/training/danh-gia-phan-loai-lao-dong')}
                        gradient="from-indigo-500 to-indigo-700"
                    />
                    <CourseCard
                        icon="fa-medkit"
                        title="Sơ Cấp Cứu"
                        onClick={() => navigate('/training/so-cap-cuu')}
                        gradient="from-pink-500 to-pink-700"
                    />
                </div>
            </div>
        </section>
    );
};

export default CoursesSection;
