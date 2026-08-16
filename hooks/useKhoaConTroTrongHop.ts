import { useEffect, useRef } from 'react';

/**
 * Giữ con trỏ bàn phím ở lại bên trong hộp thoại.
 *
 * VẤN ĐỀ THẬT ĐÃ ĐO ĐƯỢC (trên hộp đăng nhập):
 *
 *   Con trỏ sau khi mở hộp : BODY  — chưa vào hộp
 *   Phần tử ngoài hộp vẫn tab tới được : 26
 *
 * Hai hậu quả với người chỉ dùng bàn phím:
 *
 *   1. Mở hộp thoại xong phải nhấn Tab rất nhiều lần mới tới được ô đầu tiên,
 *      vì con trỏ vẫn nằm ngoài.
 *   2. Tab quá ô cuối là lạc ra menu phía sau — chỗ đang bị lớp phủ che, nhìn
 *      không thấy con trỏ đâu. Với người dùng trình đọc màn hình thì càng rối:
 *      họ nghe đọc những mục lẽ ra đang bị che.
 *
 * Hook này làm ba việc: đưa con trỏ vào hộp khi mở, giữ vòng Tab bên trong, và
 * trả con trỏ về đúng nút đã mở hộp khi đóng — để người dùng không bị mất chỗ.
 */

const CHON_DUOC =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const useKhoaConTroTrongHop = (dangMo: boolean) => {
  const hopRef = useRef<HTMLDivElement>(null);
  const noiTraVe = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!dangMo) return;

    // Nhớ chỗ đang đứng để lát nữa trả con trỏ về
    noiTraVe.current = document.activeElement as HTMLElement;

    const hop = hopRef.current;
    if (!hop) return;

    const layDanhSach = (): HTMLElement[] =>
      [...hop.querySelectorAll<HTMLElement>(CHON_DUOC)].filter((e) => e.offsetParent !== null);

    // Đưa con trỏ vào ô đầu tiên. Chờ một nhịp để hộp kịp dựng xong.
    const hen = setTimeout(() => {
      const ds = layDanhSach();
      (ds[0] ?? hop).focus();
    }, 50);

    const xuLyTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const ds = layDanhSach();
      if (ds.length === 0) return;

      const dau = ds[0];
      const cuoi = ds[ds.length - 1];
      const dangO = document.activeElement as HTMLElement;

      // Đang ở ngoài hộp (hoặc ở body) thì kéo về trong
      if (!hop.contains(dangO)) {
        e.preventDefault();
        (e.shiftKey ? cuoi : dau).focus();
        return;
      }

      // Tới cuối rồi Tab tiếp thì vòng về đầu, và ngược lại
      if (!e.shiftKey && dangO === cuoi) {
        e.preventDefault();
        dau.focus();
      } else if (e.shiftKey && dangO === dau) {
        e.preventDefault();
        cuoi.focus();
      }
    };

    document.addEventListener('keydown', xuLyTab);

    return () => {
      clearTimeout(hen);
      document.removeEventListener('keydown', xuLyTab);
      // Trả con trỏ về chỗ cũ để người dùng không bị mất phương hướng
      noiTraVe.current?.focus?.();
    };
  }, [dangMo]);

  return hopRef;
};
