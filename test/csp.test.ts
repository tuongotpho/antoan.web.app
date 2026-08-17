import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Chính sách CSP là hàng rào cuối cùng: nếu có mã lạ chui được vào trang, CSP
 * quyết định nó có tải thêm được mã từ máy chủ ngoài hay không.
 *
 * Hai điều test này canh:
 *
 * 1. firebase.json chứa HAI khối CSP giống hệt nhau (hai cấu hình hosting).
 *    Sửa một khối mà quên khối kia là chuyện đã lặp nhiều lần ở dự án này —
 *    và ở đây thì hậu quả là một nửa lưu lượng chạy dưới chính sách cũ.
 *
 * 2. Không được cho phép những nguồn ngoài đã thôi dùng. Ba tên miền dưới đây
 *    là di tích từ thời app còn nạp Tailwind, React và FontAwesome qua CDN;
 *    từ khi chuyển sang Vite thì mọi thứ đã đóng gói tại chỗ — đã kiểm bản
 *    build: không file nào trỏ tới chúng, 4 file phông chữ nằm ngay trong
 *    dist/assets. Để chúng trong CSP nghĩa là vẫn mở sẵn ba cửa cho mã lạ.
 */

const firebaseJson = readFileSync(resolve(__dirname, '..', 'firebase.json'), 'utf8');

const layCacCSP = (): string[] => {
  const cau = JSON.parse(firebaseJson);
  const ds: string[] = [];
  const duyet = (nut: unknown): void => {
    if (Array.isArray(nut)) return nut.forEach(duyet);
    if (nut && typeof nut === 'object') {
      const o = nut as Record<string, unknown>;
      if (o.key === 'Content-Security-Policy' && typeof o.value === 'string') ds.push(o.value);
      Object.values(o).forEach(duyet);
    }
  };
  duyet(cau);
  return ds;
};

/** Tên miền đã thôi dùng từ khi chuyển sang Vite. */
const NGUON_DA_BO = [
  'cdn.tailwindcss.com',
  'aistudiocdn.com',
  'cdnjs.cloudflare.com',
];

describe('Content-Security-Policy', () => {
  const cacCSP = layCacCSP();

  it('có đúng 2 khối CSP trong firebase.json', () => {
    expect(cacCSP.length).toBe(2);
  });

  it('hai khối CSP phải giống hệt nhau, không được lệch', () => {
    expect(cacCSP[0]).toBe(cacCSP[1]);
  });

  for (const nguon of NGUON_DA_BO) {
    it(`không còn cho phép ${nguon}`, () => {
      const dinh = cacCSP.filter((c) => c.includes(nguon));
      expect(dinh, `${nguon} vẫn nằm trong CSP`).toEqual([]);
    });
  }

  it('vẫn giữ những nguồn đang thật sự cần', () => {
    // Bỏ nhầm mấy nguồn này thì hỏng tính năng thật:
    //  - googletagmanager: đo lượt truy cập, có thẻ script trong index.html
    //  - accounts/apis.google.com: cửa sổ đăng nhập Google của Firebase Auth
    //  - googleapis.com: mọi lệnh đọc/ghi Firestore và Storage
    //  - images.unsplash.com: ảnh bìa 8 trang lĩnh vực huấn luyện
    for (const c of cacCSP) {
      expect(c).toContain('https://www.googletagmanager.com');
      expect(c).toContain('https://accounts.google.com');
      expect(c).toContain('https://apis.google.com');
      expect(c).toContain('https://*.googleapis.com');
      expect(c).toContain('https://images.unsplash.com');
    }
  });

  it('giữ các chốt chặn cơ bản', () => {
    for (const c of cacCSP) {
      expect(c).toContain("default-src 'self'");
      expect(c).toContain("base-uri 'self'");
      expect(c).toContain("form-action 'self'");
    }
  });
});
