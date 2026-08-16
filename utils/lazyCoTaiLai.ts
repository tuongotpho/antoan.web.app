import { lazy, type ComponentType } from 'react';

/**
 * Nạp trang theo kiểu chia nhỏ, có tự phục hồi khi gặp bản deploy mới.
 *
 * VẤN ĐỀ THẬT ĐÃ GẶP:
 *
 *   Failed to fetch dynamically imported module:
 *   https://antoan.web.app/assets/HomePage-Cno4AOVi.js
 *
 * Mã của trang được chia thành nhiều mảnh, mỗi mảnh có tên kèm mã băm
 * (HomePage-Cno4AOVi.js). Mỗi lần deploy, mã băm đổi theo nội dung. Ai đang mở
 * trang từ trước khi deploy thì trong trí nhớ vẫn là tên mảnh CŨ — bấm sang
 * trang khác là đi tìm một file không còn tồn tại.
 *
 * Tệ hơn: Firebase Hosting có luật "đường dẫn lạ thì trả index.html", nên máy
 * chủ không báo 404 mà trả về một trang HTML. Trình duyệt xin JavaScript, nhận
 * HTML, và từ chối với đúng thông báo trên. Người dùng thấy trang trắng.
 *
 * CÁCH XỬ LÝ: bắt lỗi đó rồi tải lại trang đúng MỘT lần. Tải lại sẽ lấy về
 * index.html mới, trong đó trỏ tới tên mảnh mới, và mọi thứ chạy tiếp bình
 * thường. Người dùng chỉ thấy trang chớp một cái.
 *
 * Cờ chặn lặp là bắt buộc: nếu lỗi đến từ nguyên nhân khác (mất mạng, máy chủ
 * hỏng), tải lại vô điều kiện sẽ thành vòng lặp bất tận. Cờ lưu trong
 * sessionStorage nên tự mất khi đóng tab.
 */

const KHOA_DA_TAI_LAI = 'antoan:da-tai-lai-vi-ban-moi';

/** Xoá cờ khi nạp trang trót lọt — để lần deploy sau vẫn còn một lượt phục hồi. */
const xoaCoTaiLai = () => {
  try {
    sessionStorage.removeItem(KHOA_DA_TAI_LAI);
  } catch {
    // Trình duyệt chặn sessionStorage (chế độ riêng tư) — bỏ qua.
  }
};

const daTaiLaiRoi = (): boolean => {
  try {
    return sessionStorage.getItem(KHOA_DA_TAI_LAI) === '1';
  } catch {
    // Không đọc được thì coi như đã tải lại, để tuyệt đối không lặp.
    return true;
  }
};

const danhDauDaTaiLai = () => {
  try {
    sessionStorage.setItem(KHOA_DA_TAI_LAI, '1');
  } catch {
    // Không ghi được thì thôi, phần dưới vẫn ném lỗi ra ErrorBoundary.
  }
};

/**
 * Nhận biết lỗi "mảnh mã không còn tồn tại sau khi deploy bản mới".
 *
 * Mỗi trình duyệt báo một kiểu chữ khác nhau nên phải dò nhiều mẫu.
 */
const laLoiThieuManhMa = (loi: unknown): boolean => {
  const mota = loi instanceof Error ? `${loi.name}: ${loi.message}` : String(loi);
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload|ChunkLoadError/i.test(
    mota
  );
};

/**
 * Dùng thay cho React.lazy trong bảng định tuyến.
 */
export function lazyCoTaiLai<T extends ComponentType<unknown>>(
  nhapModule: () => Promise<{ default: T }>
) {
  return lazy(() =>
    nhapModule()
      .then((m) => {
        xoaCoTaiLai();
        return m;
      })
      .catch((loi) => {
        if (laLoiThieuManhMa(loi) && !daTaiLaiRoi()) {
          danhDauDaTaiLai();
          window.location.reload();
          // Trả về một lời hứa không bao giờ xong, để React đứng yên ở màn hình
          // chờ trong lúc trang tải lại — thay vì chớp qua thông báo lỗi.
          return new Promise<{ default: T }>(() => {});
        }
        // Nguyên nhân khác, hoặc đã thử tải lại rồi mà vẫn hỏng: ném ra cho
        // ErrorBoundary xử lý, không im lặng nuốt lỗi.
        throw loi;
      })
  );
}

// Xuất riêng để test được
export const _noiBo = { laLoiThieuManhMa, KHOA_DA_TAI_LAI };
