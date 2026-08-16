/* eslint-disable react-refresh/only-export-components --
   File này chỉ khai báo bảng định tuyến, không phải nơi định nghĩa component.
   Mỗi dòng `lazy(() => import(...))` đều bị quy tắc hot-reload của React đếm là
   một component xuất khẩu sai chỗ, sinh ra 10 cảnh báo nhiễu che mất những cảnh
   báo thật. Tách chúng ra file khác không làm mã tốt lên, chỉ để chiều quy tắc. */
import React, { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const RequestsPage = lazy(() => import('./pages/RequestsPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const TrainingLandingPage = lazy(() => import('./pages/TrainingLandingPage'));
const AllPartnersPage = lazy(() => import('./pages/AllPartnersPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

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
