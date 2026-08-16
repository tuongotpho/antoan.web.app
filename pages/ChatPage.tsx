import React, { useState, useEffect, useContext } from 'react';
import { db, collection, query, where, orderBy, onSnapshot } from '../services/firebaseConfig';
import { ChatRoom } from '../types';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import LoadingSpinner from '../components/LoadingSpinner';
import { AppContext } from '../App';
import SEOHead from '../components/SEOHead';

const ChatPage: React.FC = () => {
  const { user, isAdmin, partnerStatus, onLoginRequired } = useContext(AppContext);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'client' | 'partner' | 'admin'>('client');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!user) {
      onLoginRequired();
      return;
    }

    // Determine user role
    if (isAdmin) {
      setUserRole('admin');
      setUserName('Admin');
    } else if (partnerStatus === 'approved') {
      setUserRole('partner');
      setUserName(user.email || 'Partner');
    } else {
      setUserRole('client');
      setUserName(user.email || 'Client');
    }

    // Query chat rooms based on role
    const roomsCollection = collection(db, 'chatRooms');
    let q;

    if (isAdmin) {
      // Admin can see all rooms
      q = query(roomsCollection, orderBy('lastMessageTime', 'desc'));
    } else if (partnerStatus === 'approved') {
      // Partners see rooms where they are the partner
      q = query(
        roomsCollection,
        where('partnerId', '==', user.uid),
        orderBy('lastMessageTime', 'desc')
      );
    } else {
      // Clients see rooms where they are the client
      q = query(
        roomsCollection,
        where('clientId', '==', user.uid),
        orderBy('lastMessageTime', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as ChatRoom
      );
      setRooms(roomsData);
      setLoading(false);

      // Auto-select first room if none selected
      if (!selectedRoom && roomsData.length > 0) {
        setSelectedRoom(roomsData[0]);
      }
    });

    return () => unsubscribe();
  }, [user, isAdmin, partnerStatus]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        {/* Đặt thẻ SEO ở CẢ nhánh này. Thẻ ở phần hiển thị chính nằm mãi dưới,
            mà khách chưa đăng nhập thì thoát ở đây trước — nên trang giữ nguyên
            tiêu đề của trang vừa xem và vẫn cho phép lập chỉ mục. */}
        <SEOHead
          title="Tin nhắn | SafetyConnect"
          description="Trao đổi giữa doanh nghiệp và đơn vị đào tạo."
          noindex
        />
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8">
          <i className="fas fa-lock text-5xl text-gray-400 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Đăng nhập để tiếp tục</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập để sử dụng chức năng chat.</p>
          <button
            onClick={onLoginRequired}
            className="bg-gradient-to-r from-primary to-orange-500 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="large" message="Đang tải tin nhắn..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 h-full flex flex-col">
      {/* Khu vực riêng tư: đặt tiêu đề riêng cho dễ nhận ra khi mở nhiều tab,
          và chặn công cụ tìm kiếm lập chỉ mục. Trước đây trang này giữ nguyên
          tiêu đề mặc định của cả website. */}
      <SEOHead
        title="Tin nhắn | SafetyConnect"
        description="Trao đổi giữa doanh nghiệp và đơn vị đào tạo."
        noindex
      />
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-800">
          <i className="fas fa-comments text-primary mr-3"></i>
          Tin nhắn
        </h1>
        <p className="text-gray-600 mt-2">
          {isAdmin
            ? 'Quản lý tất cả các cuộc trò chuyện'
            : partnerStatus === 'approved'
              ? 'Trao đổi với khách hàng về các yêu cầu đào tạo'
              : 'Trao đổi với đối tác đào tạo'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Chat List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-primary to-orange-500 text-white px-6 py-4 flex-shrink-0">
            <h3 className="font-bold text-lg">Cuộc trò chuyện</h3>
            <p className="text-sm text-white/80">{rooms.length} cuộc trò chuyện</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ChatList
              rooms={rooms}
              selectedRoomId={selectedRoom?.id || null}
              onSelectRoom={setSelectedRoom}
              userRole={userRole}
            />
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {selectedRoom ? (
            <ChatWindow
              room={selectedRoom}
              currentUser={user}
              userRole={userRole}
              userName={userName}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg shadow-lg text-gray-400">
              <i className="fas fa-comment-dots text-6xl mb-4"></i>
              <p className="text-lg">Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
