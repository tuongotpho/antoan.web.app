/**
 * Service worker TỰ GỠ.
 *
 * VÌ SAO PHẢI CÓ FILE NÀY THAY VÌ XOÁ HẲN:
 *
 * Bản chạy ngoài đời trước đây có đăng ký một service worker dùng chiến lược
 * "lấy từ cache trước" cho cả `/` và `/index.html`. Nghĩa là mọi trình duyệt
 * đã từng mở trang đều giữ một bản index.html cũ và trả về bản đó mãi mãi —
 * mà index.html là nơi trỏ tới tên file JS có mã băm, nên người dùng kẹt luôn
 * ở bản cũ dù máy chủ đã có bản mới. Chính điều này vô hiệu hoá luôn header
 * `Cache-Control: no-cache` mà firebase.json đặt cho /index.html.
 *
 * Mã nguồn hiện tại đã bỏ đoạn đăng ký, NHƯNG bỏ đăng ký trong mã không gỡ
 * được service worker đã nằm sẵn trong máy người dùng — nó sống độc lập với
 * trang web. Nếu chỉ xoá file này đi, trình duyệt cũ vẫn chạy bản service
 * worker cũ đã lưu và người dùng vẫn kẹt.
 *
 * Cách thoát duy nhất là deploy một service worker mới tại đúng đường dẫn cũ,
 * và việc của nó là dọn sạch rồi tự gỡ chính mình.
 *
 * Sau khi phần lớn người dùng đã ghé lại trang (khoảng vài tháng), có thể xoá
 * hẳn file này cùng dòng khai báo trong firebase.json.
 */

self.addEventListener('install', () => {
  // Bỏ qua giai đoạn chờ để bản tự gỡ này thay thế bản cũ ngay lập tức.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Xoá toàn bộ cache do bản cũ tạo ra.
      const tenCache = await caches.keys();
      await Promise.all(tenCache.map((ten) => caches.delete(ten)));

      // 2. Tự gỡ đăng ký.
      await self.registration.unregister();

      // 3. Nạp lại các tab đang mở để chúng lấy bản mới thẳng từ máy chủ.
      const cacTab = await self.clients.matchAll({ type: 'window' });
      cacTab.forEach((tab) => tab.navigate(tab.url));
    })()
  );
});

// Không chặn request nào nữa: mọi thứ đi thẳng ra mạng như khi không có
// service worker. Cố tình KHÔNG đăng ký listener 'fetch'.
