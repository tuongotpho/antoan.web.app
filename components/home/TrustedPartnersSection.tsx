import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { TrustedPartner, PartnerProfile, partnerProfileToTrustedPartner } from '../../types';
import TrustedPartnerCard from '../TrustedPartnerCard';
import TrustedPartnerInfoModal from '../TrustedPartnerInfoModal';
import { muonGiamChuyenDong } from '../../utils/cuonTrang';

/** Dưới mức này thì một bản sao không đủ phủ kín màn hình, băng trượt sẽ hở. */
const TOI_THIEU_DE_TRUOT = 4;

/** Mỗi thẻ mất bấy nhiêu giây để đi hết màn hình. Thẻ càng nhiều, vòng càng dài. */
const GIAY_MOI_THE = 5;

const TrustedPartnersSection: React.FC = () => {
    const navigate = useNavigate();
    const [trustedPartners, setTrustedPartners] = useState<TrustedPartner[]>([]);
    const [selectedPartner, setSelectedPartner] = useState<TrustedPartner | null>(null);
    const [giamChuyenDong] = useState(muonGiamChuyenDong);

    // Lấy toàn bộ đối tác nổi bật, KHÔNG cắt bớt: yêu cầu là băng trượt vô hạn,
    // bao nhiêu đối tác cũng chạy được.
    //
    // Không còn chờ đăng nhập nữa. firestore.rules nay cho đọc công khai hồ sơ
    // có status == 'approved', nên khách vãng lai cũng thấy — trước đây họ luôn
    // gặp dòng "Đang cập nhật đối tác" dù danh sách có người.
    //
    // Điều kiện where('status','==','approved') là BẮT BUỘC, không phải để lọc
    // cho gọn: Firestore chỉ chấp nhận truy vấn khi chắc chắn MỌI bản ghi trả về
    // đều qua được rules. Bỏ nó đi thì cả truy vấn bị từ chối.
    useEffect(() => {
        const partnersQuery = query(
            collection(db, 'partners'),
            where('status', '==', 'approved'),
            where('featured', '==', true)
        );

        const unsubscribe = onSnapshot(
            partnersQuery,
            (querySnapshot) => {
                const partnersData = querySnapshot.docs.map((docSnap) =>
                    partnerProfileToTrustedPartner({
                        uid: docSnap.id,
                        ...docSnap.data(),
                    } as PartnerProfile)
                );

                // Sắp xếp bằng JavaScript để khỏi phải tạo chỉ mục ghép trên Firestore.
                partnersData.sort((a, b) => {
                    const orderA = a.displayOrder ?? 999999;
                    const orderB = b.displayOrder ?? 999999;
                    return orderA - orderB;
                });

                setTrustedPartners(partnersData);
            },
            (err) => {
                console.error('Lỗi khi tải danh sách đối tác: ', err);
            }
        );

        return () => unsubscribe();
    }, []);

    const duDeTruot = trustedPartners.length >= TOI_THIEU_DE_TRUOT && !giamChuyenDong;

    const veThe = (partner: TrustedPartner, khoa: string) => (
        <div key={khoa} className="the-truot">
            <TrustedPartnerCard partner={partner} onClick={() => setSelectedPartner(partner)} />
        </div>
    );

    return (
        <>
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <div className="inline-flex bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4 items-center gap-2 justify-center">
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
                            {duDeTruot ? (
                                <div
                                    className="relative overflow-hidden mb-12"
                                    role="region"
                                    aria-label={`Băng trượt ${trustedPartners.length} đối tác huấn luyện`}
                                >
                                    <div
                                        className="bang-truot"
                                        style={
                                            {
                                                '--thoi-luong-truot': `${trustedPartners.length * GIAY_MOI_THE}s`,
                                            } as React.CSSProperties
                                        }
                                    >
                                        {trustedPartners.map((p) => veThe(p, p.id))}

                                        {/* Bản sao chỉ để mắt nhìn thấy liền mạch. aria-hidden để
                                            trình đọc màn hình không đọc lại toàn bộ danh sách lần
                                            hai, và inert để bàn phím không lạc vào các thẻ trùng. */}
                                        <div className="flex" aria-hidden="true" inert>
                                            {trustedPartners.map((p) => veThe(p, `ban-sao-${p.id}`))}
                                        </div>
                                    </div>

                                    {/* Mờ dần hai mép để thẻ trôi ra khỏi khung êm hơn là bị cắt cụt. */}
                                    <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent"></div>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent"></div>
                                </div>
                            ) : (
                                // Ít đối tác, hoặc người dùng đã bật "giảm chuyển động": bày ngang
                                // và cho cuộn tay. Chạy băng trượt lúc này chỉ tạo ra khoảng hở.
                                <div className="flex justify-center flex-wrap gap-8 mb-12 overflow-x-auto">
                                    {trustedPartners.map((partner) => (
                                        <div key={partner.id} className="w-full max-w-sm">
                                            <TrustedPartnerCard
                                                partner={partner}
                                                onClick={() => setSelectedPartner(partner)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

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
