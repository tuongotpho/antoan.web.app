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
// Mở DevTools trên site đang chạy là biết ngay bản nào đang được phục vụ.
console.log('ver.6826');
