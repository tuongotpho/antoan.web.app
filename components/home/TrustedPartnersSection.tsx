import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { TrustedPartner, PartnerProfile, partnerProfileToTrustedPartner } from '../../types';
import TrustedPartnerCard from '../TrustedPartnerCard';
import TrustedPartnerInfoModal from '../TrustedPartnerInfoModal';
import { AppContext } from '../../App';

const TrustedPartnersSection: React.FC = () => {
    const navigate = useNavigate();
    const { user, loadingAuth } = useContext(AppContext);
    const [trustedPartners, setTrustedPartners] = useState<TrustedPartner[]>([]);
    const [selectedPartner, setSelectedPartner] = useState<TrustedPartner | null>(null);

    // Lấy danh sách đối tác nổi bật.
    //
    // PHẢI chờ Firebase khôi phục xong phiên đăng nhập rồi mới truy vấn.
    // Trước đây khối này truy vấn ngay lúc trang dựng, mà lúc đó người dùng vẫn
    // đang là "chưa đăng nhập" nên rules từ chối — và vì danh sách phụ thuộc
    // rỗng, nó không bao giờ thử lại. Kết quả: người ĐÃ đăng nhập vẫn thấy dòng
    // "Đang cập nhật đối tác" mãi mãi.
    useEffect(() => {
        // Đang khôi phục phiên thì chưa tới lượt
        if (loadingAuth) return;

        // Chưa đăng nhập thì rules chặn sẵn, khỏi gọi cho tốn lượt đọc
        if (!user) {
            setTrustedPartners([]);
            return;
        }

        const partnersCollection = collection(db, 'partners');
        // Remove orderBy to avoid composite index requirement
        // We'll sort in JavaScript and limit after sorting
        const partnersQuery = query(
            partnersCollection,
            where('status', '==', 'approved'),
            where('featured', '==', true)
        );

        const unsubscribe = onSnapshot(
            partnersQuery,
            (querySnapshot) => {
                const partnersData = querySnapshot.docs.map((docSnap) => {
                    const partnerProfile = {
                        uid: docSnap.id,
                        ...docSnap.data(),
                    } as PartnerProfile;
                    return partnerProfileToTrustedPartner(partnerProfile);
                });

                // Sort by displayOrder and limit to 3 in JavaScript
                partnersData.sort((a, b) => {
                    const orderA = a.displayOrder ?? 999999;
                    const orderB = b.displayOrder ?? 999999;
                    return orderA - orderB;
                });

                setTrustedPartners(partnersData.slice(0, 3));
            },
            (err) => {
                // permission-denied ở đây KHÔNG phải hỏng hóc: firestore.rules
                // yêu cầu đăng nhập mới đọc được bảng partners (để đối thủ không
                // hút được email và số điện thoại đối tác). Khách vãng lai vì thế
                // luôn rơi vào nhánh này, và khối bên dưới hiện "Đang cập nhật
                // đối tác".
                //
                // Muốn khách chưa đăng nhập cũng thấy được danh sách đối tác thì
                // phải chọn một trong hai hướng, xem mục A1b của phiếu kiểm định:
                //   - mở rules cho đọc công khai hồ sơ đã duyệt (đánh đổi: lộ
                //     email/SĐT đối tác), hoặc
                //   - tách phần giới thiệu công khai sang bảng riêng, giữ thông
                //     tin liên hệ ở bảng cần đăng nhập.
                if (err?.code === 'permission-denied') {
                    console.warn(
                        'Danh sách đối tác chỉ hiển thị cho người đã đăng nhập (theo firestore.rules).'
                    );
                    return;
                }
                console.error('Lỗi khi tải danh sách đối tác: ', err);
            }
        );

        return () => unsubscribe();
        // Chạy lại khi phiên đăng nhập sẵn sàng hoặc khi đổi tài khoản
    }, [user, loadingAuth]);

    return (
        <>
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <div className="inline-block bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4 flex items-center gap-2 justify-center">
                            <i className="fas fa-check-circle"></i>
                            <span>ĐỐI TÁC UY TÍN</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-neutral-dark mb-4">
                            Đơn vị đối tác huấn luyện được xác nhận
                        </h2>
                        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                            Các đơn vị đào tạo an toàn lao động uy tín, được kiểm chứng và đánh giá cao
                        </p>
                    </div>

                    {trustedPartners.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                                {trustedPartners.map((partner) => (
                                    <TrustedPartnerCard
                                        key={partner.id}
                                        partner={partner}
                                        onClick={() => setSelectedPartner(partner)}
                                    />
                                ))}
                            </div>

                            {/* View All Partners Button */}
                            <div className="text-center">
                                <button
                                    onClick={() => navigate('/partners')}
                                    className="group bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105 inline-flex items-center gap-3"
                                >
                                    <span>Xem tất cả đối tác</span>
                                    <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300">
                            <div className="max-w-md mx-auto">
                                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                    <i className="fas fa-handshake text-4xl text-blue-600"></i>
                                </div>
                                <h3 className="text-2xl font-bold text-neutral-dark mb-3">Đang cập nhật đối tác</h3>
                                <p className="text-gray-600 mb-6">
                                    Chúng tôi đang xác minh và thêm các đối tác đào tạo uy tín. Vui lòng quay lại sau.
                                </p>
                                <button
                                    onClick={() => navigate('/partners')}
                                    className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-2"
                                >
                                    <span>Xem tất cả đối tác</span>
                                    <i className="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Trusted Partner Info Modal */}
            {selectedPartner && (
                <TrustedPartnerInfoModal
                    partner={selectedPartner}
                    onClose={() => setSelectedPartner(null)}
                    onViewAllPartners={() => {
                        setSelectedPartner(null);
                        navigate('/partners');
                    }}
                />
            )}
        </>
    );
};

export default TrustedPartnersSection;
