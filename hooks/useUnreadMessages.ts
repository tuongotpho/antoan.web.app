import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, type User } from '../services/firebaseConfig';
import { ID_ADMIN } from '../utils/chatHelpers';

/**
 * Hook to count unread messages for the current user
 * @param user - Current authenticated user
 * @param isAdmin - Whether user is admin
 * @param partnerStatus - Partner approval status
 * @returns Number of unread messages
 */
export const useUnreadMessages = (
  user: User | null,
  isAdmin: boolean,
  partnerStatus: 'pending' | 'approved' | 'rejected' | null
): number => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Determine user role
    let userRole: 'admin' | 'partner' | 'client';
    if (isAdmin) {
      userRole = 'admin';
    } else if (partnerStatus === 'approved') {
      userRole = 'partner';
    } else {
      userRole = 'client';
    }

    // Query chat rooms based on role
    const roomsCollection = collection(db, 'chatRooms');
    let q;

    if (userRole === 'admin') {
      // CHỈ lấy các phòng mà admin là một bên trò chuyện.
      //
      // TRƯỚC ĐÂY lấy TẤT CẢ phòng rồi cộng unreadCount.client của từng phòng.
      // Nhưng trong phòng giữa khách hàng thật và đối tác, unreadCount.client
      // là số tin mà KHÁCH chưa đọc — chẳng liên quan gì tới admin. Kết quả:
      // số đỏ trên menu của admin bị thổi phồng bởi tin nhắn của người khác,
      // bấm vào thì không thấy tin nào mới.
      //
      // Phòng admin–đối tác nhận diện bằng clientId là ID_ADMIN.
      q = query(roomsCollection, where('clientId', '==', ID_ADMIN));
    } else if (userRole === 'partner') {
      // Partners see rooms where they are the partner
      q = query(roomsCollection, where('partnerId', '==', user.uid));
    } else {
      // Clients see rooms where they are the client
      q = query(roomsCollection, where('clientId', '==', user.uid));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let totalUnread = 0;

        snapshot.docs.forEach((doc) => {
          const roomData = doc.data();

          // Admin đóng vai phía "client" trong phòng của mình, nên cùng nhánh
          // với khách hàng — nhưng chỉ với các phòng đã lọc ở truy vấn trên.
          if (userRole === 'admin' || userRole === 'client') {
            totalUnread += roomData.unreadCount?.client || 0;
          } else if (userRole === 'partner') {
            totalUnread += roomData.unreadCount?.partner || 0;
          }
        });

        setUnreadCount(totalUnread);
      },
      (err) => {
        // Trước đây không có nhánh này: khi truy vấn bị từ chối, lỗi rơi thẳng
        // ra ngoài mà không ai xử lý, và số đếm kẹt ở giá trị cũ.
        console.warn('Không đếm được tin nhắn chưa đọc:', err?.code || err);
        setUnreadCount(0);
      }
    );

    return () => unsubscribe();
  }, [user, isAdmin, partnerStatus]);

  return unreadCount;
};
