import { useEffect } from 'react';

/**
 * Đóng hộp thoại khi bấm phím Esc.
 *
 * VÌ SAO CẦN: bấm Esc để thoát là thói quen chung của mọi người, và là cách
 * DUY NHẤT với người dùng chỉ có bàn phím — họ không rê chuột ra ngoài lớp phủ
 * để bấm được. Không có nó, họ phải lần lượt nhấn Tab qua từng ô trong hộp
 * thoại cho tới khi chạm nút đóng.
 *
 * Trong dự án này, 4 trên 5 hộp thoại vốn không xử lý phím Esc: hộp đăng nhập,
 * hộp gửi báo giá, hộp thông tin đối tác và hộp danh sách người xem.
 *
 * Nghe sự kiện ở cấp document nên bắt được phím kể cả khi con trỏ đang nằm
 * trong một ô nhập bên trong hộp thoại.
 */
export const useDongBangEsc = (dangMo: boolean, onDong: () => void) => {
  useEffect(() => {
    if (!dangMo) return;

    const xuLy = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onDong();
      }
    };

    document.addEventListener('keydown', xuLy);
    return () => document.removeEventListener('keydown', xuLy);
  }, [dangMo, onDong]);
};
