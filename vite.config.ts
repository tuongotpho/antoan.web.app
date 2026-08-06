import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [tailwindcss(), react()],
    // ĐÃ GỠ khối `define` nhúng GEMINI_API_KEY vào bundle.
    //
    // `define` thay thế chuỗi ngay lúc build, nên key sẽ nằm nguyên văn trong
    // file JS công khai — ai mở DevTools cũng lấy được và tiêu hết hạn mức của
    // bạn. Hiện không chỗ nào dùng `process.env.API_KEY` nên gỡ đi là an toàn.
    // Việc gọi Gemini đã nằm ở Cloud Function `generateBlogPost` với secret
    // GEMINI_API_KEY giữ phía máy chủ — đó mới là chỗ đúng.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      assetsInlineLimit: 0,
    },
  };
});
