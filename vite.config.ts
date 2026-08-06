import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Sinh ký hiệu phiên bản theo NGÀY PHÁT HÀNH, dạng ngày+tháng+năm rút gọn.
 * Ví dụ 6/8/2026 -> "6826".
 *
 * Luôn tính theo giờ Việt Nam. Máy chạy GitHub Actions dùng giờ UTC, nên nếu
 * lấy giờ máy thì bản deploy lúc 2h sáng ở Việt Nam sẽ bị đánh số của ngày hôm
 * trước. Cộng 7 tiếng rồi đọc theo UTC là cách gọn nhất để luôn ra ngày VN.
 */
function releaseTag(): string {
  const vn = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const day = vn.getUTCDate();
  const month = vn.getUTCMonth() + 1;
  const year = String(vn.getUTCFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

// Workflow có thể truyền APP_VERSION để ghi đè; không có thì tự tính.
const appVersion = process.env.APP_VERSION || releaseTag();

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [tailwindcss(), react()],
    define: {
      // CHỈ nhúng giá trị công khai. Trước đây chỗ này nhúng GEMINI_API_KEY —
      // `define` thay chuỗi ngay lúc build nên key nằm nguyên văn trong file JS
      // công khai, ai mở DevTools cũng lấy được. Key Gemini đã chuyển sang
      // Cloud Function `generateBlogPost` giữ phía máy chủ.
      __APP_VERSION__: JSON.stringify(appVersion),
    },
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
