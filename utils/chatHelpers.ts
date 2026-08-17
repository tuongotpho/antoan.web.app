import {
  db,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from '../services/firebaseConfig';
import { TrainingRequest, ChatMessage } from '../types';

/**
 * Mã giả dùng cho phía "khách" trong phòng chat giữa admin và đối tác.
 *
 * Phòng chat có hai phía cố định là client và partner. Khi admin trao đổi với
 * đối tác, admin đóng vai phía client — nên clientId mang giá trị đặc biệt này
 * thay vì một uid thật.
 *
 * Đặt thành hằng số vì hook đếm tin chưa đọc phải so đúng giá trị này để tách
 * phòng của admin ra khỏi phòng của khách hàng thật.
 */
export const ID_ADMIN = 'admin';

/**
 * Tạo hoặc lấy phòng chat giữa đối tác và admin cho một yêu cầu cụ thể
 * @param request - Yêu cầu đào tạo
 * @param partnerId - UID của đối tác
 * @param partnerName - Tên đối tác
 * @param partnerEmail - Email đối tác
 * @returns ID của phòng chat
 */
export const getOrCreateAdminPartnerChatRoom = async (
  request: TrainingRequest,
  partnerId: string,
  partnerName: string,
  partnerEmail: string
): Promise<string> => {
  const chatRoomsRef = collection(db, 'chatRooms');

  // Kiểm tra xem đã có phòng chat cho request này chưa
  const q = query(
    chatRoomsRef,
    where('requestId', '==', request.id),
    where('partnerId', '==', partnerId)
  );
  const existingRooms = await getDocs(q);

  if (!existingRooms.empty) {
    // Phòng chat đã tồn tại
    return existingRooms.docs[0].id;
  }

  // Tạo phòng chat mới
  // Client sẽ là "admin" (placeholder), partner là đối tác thật
  const roomData = {
    requestId: request.id,
    clientId: ID_ADMIN,
    clientName: 'Admin - SafetyConnect',
    clientEmail: 'admin@safetyconnect.vn',
    partnerId: partnerId,
    partnerName: partnerName,
    partnerEmail: partnerEmail,
    lastMessage: 'Phòng chat đã được tạo',
    lastMessageTime: serverTimestamp(),
    unreadCount: {
      client: 0, // Admin
      partner: 0,
    },
    createdAt: serverTimestamp(),
  };

  const roomRef = await addDoc(chatRoomsRef, roomData);

  // Gửi tin nhắn đầu tiên
  await addDoc(collection(db, 'chatMessages'), {
    roomId: roomRef.id,
    senderId: 'system',
    senderName: 'Hệ thống',
    senderRole: 'admin',
    message: `Phòng chat đã được tạo cho yêu cầu: ${request.trainingDetails.map((d) => d.type).join(', ')}. Admin sẽ hỗ trợ bạn trong quá trình báo giá.`,
    read: false,
    createdAt: serverTimestamp(),
  });

  return roomRef.id;
};

/**
 * Tạo tin nhắn thông báo báo giá mới cho admin
 */
export const sendQuoteNotificationToAdminChat = async (
  roomId: string,
  partnerId: string,
  partnerName: string,
  price: number
) => {
  await addDoc(collection(db, 'chatMessages'), {
    roomId: roomId,
    senderId: partnerId,
    senderName: partnerName,
    senderRole: 'partner',
    message: `Tôi đã gửi báo giá ${price.toLocaleString('vi-VN')} VND cho yêu cầu này. Nếu có thắc mắc gì, mong admin hỗ trợ.`,
    read: false,
    createdAt: serverTimestamp(),
  });
};

/**
 * Format timestamp to time string (e.g. 10:30 AM)
 */
export const formatMessageTime = (timestamp: any): string => {
  if (!timestamp) return '';

  // Handle Firestore Timestamp
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Group messages by date
 */
export const groupMessagesByDate = (messages: ChatMessage[]) => {
  const groups: { [key: string]: ChatMessage[] } = {};

  messages.forEach(message => {
    if (!message.createdAt) return;

    // Handle both Firestore Timestamp and Date objects
    // @ts-expect-error - Timestamp handling
    const date = message.createdAt.toDate ? message.createdAt.toDate() : new Date(message.createdAt);
    const dateString = date.toLocaleDateString('vi-VN');

    if (!groups[dateString]) {
      groups[dateString] = [];
    }

    groups[dateString].push(message);
  });

  return groups;
};
