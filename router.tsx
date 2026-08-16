import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { lazyCoTaiLai } from './utils/lazyCoTaiLai';

// Mã mỗi trang được tải riêng khi cần, cho trang chủ nhẹ hơn.
//
// Dùng lazyCoTaiLai thay cho React.lazy: sau mỗi lần deploy, tên các mảnh mã
// đổi theo nội dung, nên ai đang mở trang từ trước sẽ đi tìm một file không
// còn tồn tại và nhận lỗi "Failed to fetch dynamically imported module".
// lazyCoTaiLai bắt đúng lỗi đó rồi tải lại trang một lần để lấy tên mảnh mới.
const HomePage = lazyCoTaiLai(() => import('./pages/HomePage'));
const RequestsPage = lazyCoTaiLai(() => import('./pages/RequestsPage'));
const BlogPage = lazyCoTaiLai(() => import('./pages/BlogPage'));
const BlogDetailPage = lazyCoTaiLai(() => import('./pages/BlogDetailPage'));
const DocumentsPage = lazyCoTaiLai(() => import('./pages/DocumentsPage'));
const ChatPage = lazyCoTaiLai(() => import('./pages/ChatPage'));
const AdminPage = lazyCoTaiLai(() => import('./pages/AdminPage'));
const TrainingLandingPage = lazyCoTaiLai(() => import('./pages/TrainingLandingPage'));
const AllPartnersPage = lazyCoTaiLai(() => import('./pages/AllPartnersPage'));
const NotFoundPage = lazyCoTaiLai(() => import('./pages/NotFoundPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'requests',
        element: <RequestsPage />,
      },
      {
        path: 'blog',
        element: <BlogPage />,
      },
      {
        path: 'blog/:slug',
        element: <BlogDetailPage />,
      },
      {
        path: 'documents',
        element: <DocumentsPage />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: 'admin',
        element: <AdminPage />,
      },
      // All partners page
      {
        path: 'partners',
        element: <AllPartnersPage />,
      },
      // Training landing pages - using dynamic route with param
      {
        path: 'training/:type',
        element: <TrainingLandingPage />,
      },
      // Địa chỉ không khớp route nào.
      //
      // TRƯỚC ĐÂY chuyển hướng lặng lẽ về trang chủ. Người dùng bấm phải link
      // hỏng thì thấy trang chủ và tưởng website lỗi; còn Google coi đó là
      // "404 giả" — địa chỉ rác vẫn vào chỉ mục và kéo điểm cả site xuống.
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
