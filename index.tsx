import './src/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// Ký hiệu phiên bản theo ngày phát hành, dạng ngày+tháng+năm rút gọn (6/8/26).
// Giá trị do vite.config.ts sinh tự động lúc build theo giờ Việt Nam, không cần
// sửa tay. Mở DevTools trên site đang chạy là biết ngay bản nào đang phục vụ.
console.log(`ver.${__APP_VERSION__}`);

// Dọn service worker cũ.
//
// Bản chạy trước đây đăng ký một service worker lấy index.html "từ cache trước",
// khiến người dùng kẹt vĩnh viễn ở bản cũ dù máy chủ đã có bản mới. Bỏ đoạn đăng
// ký trong mã là chưa đủ: service worker đã cài vẫn sống độc lập trong trình
// duyệt. public/sw.js nay là bản tự gỡ, nhưng trình duyệt có thể chờ tới 24 giờ
// mới kiểm tra bản mới của nó — nên chủ động gỡ ngay từ đây.
//
// Khi không còn service worker nào, đoạn này không làm gì cả.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then(async (dsDangKy) => {
      if (dsDangKy.length === 0) return;

      await Promise.all(dsDangKy.map((dk) => dk.unregister()));

      if ('caches' in window) {
        const ten = await caches.keys();
        await Promise.all(ten.map((t) => caches.delete(t)));
      }

      console.warn('Đã gỡ service worker cũ và xoá cache. Tải lại trang để lấy bản mới nhất.');
    })
    .catch((err) => {
      console.warn('Không gỡ được service worker cũ:', err);
    });
}
