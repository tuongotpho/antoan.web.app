import { useState, useEffect } from 'react';
import {
    db,
    collection,
    query,
    orderBy,
    onSnapshot,
    Timestamp,
    type User,
} from '../services/firebaseConfig';
import { PartnerProfile, TrainingRequest } from '../types';

/**
 * Nạp dữ liệu cho trang quản trị.
 *
 * PHẢI nhận `user` và chờ có giá trị rồi mới truy vấn.
 *
 * TRƯỚC ĐÂY hook chạy với danh sách phụ thuộc rỗng, tức truy vấn ngay khi trang
 * vừa dựng. Nhưng Firebase khôi phục phiên đăng nhập bất đồng bộ: ở thời điểm
 * đó người dùng vẫn đang là "chưa đăng nhập", nên firestore.rules từ chối cả
 * hai truy vấn và hook ghi lại lỗi phân quyền.
 *
 * Vì danh sách phụ thuộc rỗng, hook KHÔNG BAO GIỜ thử lại sau khi đăng nhập
 * xong. Lỗi đó nằm lại vĩnh viễn, và AdminPage thoát sớm ở nhánh báo lỗi —
 * không vẽ ra tab nào cả, nên bấm gì cũng không ăn.
 *
 * Nay chờ có `user` mới truy vấn, và chạy lại mỗi khi tài khoản đổi.
 */
export const useAdminData = (user: User | null) => {
    const [partners, setPartners] = useState<PartnerProfile[]>([]);
    const [requests, setRequests] = useState<TrainingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        setLoadError('');

        // Chưa đăng nhập xong thì chưa truy vấn. Không phải lỗi, chỉ là chưa
        // tới lượt — AdminPage đã có màn hình riêng cho trạng thái này.
        if (!user) {
            setLoading(false);
            setPartners([]);
            setRequests([]);
            return;
        }

        setLoading(true);

        const partnersCollection = collection(db, 'partners');
        const partnersQuery = query(partnersCollection, orderBy('createdAt', 'desc'));
        const partnersUnsubscribe = onSnapshot(
            partnersQuery,
            (querySnapshot) => {
                const partnersData = querySnapshot.docs.map(
                    (docSnap) =>
                        ({
                            uid: docSnap.id,
                            ...docSnap.data(),
                            // Ensure createdAt is a Firestore Timestamp
                            createdAt: docSnap.data().createdAt || Timestamp.now(),
                        }) as PartnerProfile
                );
                setPartners(partnersData);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching partners: ', err);
                setLoadError((prev) => `${prev}\nKhông thể tải danh sách đối tác: ${err.message}`);
                setLoading(false);
            }
        );

        const requestsCollection = collection(db, 'trainingRequests');
        const requestsQuery = query(requestsCollection, orderBy('createdAt', 'desc'));
        const requestsUnsubscribe = onSnapshot(
            requestsQuery,
            (querySnapshot) => {
                const requestsData = querySnapshot.docs.map(
                    (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as TrainingRequest
                );
                setRequests(requestsData);
            },
            (err) => {
                console.error('Error fetching requests: ', err);
                setLoadError((prev) => `${prev}\nKhông thể tải danh sách yêu cầu: ${err.message}`);
            }
        );

        return () => {
            partnersUnsubscribe();
            requestsUnsubscribe();
        };
        // Chạy lại khi đổi tài khoản đăng nhập
    }, [user]);

    return { partners, requests, loading, loadError };
};
