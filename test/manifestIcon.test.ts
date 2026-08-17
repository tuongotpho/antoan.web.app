import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * manifest.json phải khai ĐÚNG kích thước thật của từng file icon.
 *
 * LỖI ĐÃ CÓ THẬT: public/icon-192.png trùng byte hệt icon-512.png (cùng mã
 * băm MD5) và thật ra là ảnh 512x512, nhưng manifest khai nó là "192x192".
 * Chrome đối chiếu kích thước khai báo với ảnh thật; lệch thì nó bỏ qua icon
 * đó, và mục "Thêm vào màn hình chính" có thể hỏng hoặc dùng icon mặc định.
 *
 * Ngoài ra icon khai "purpose": "any maskable" trong khi hình vẽ phủ kín tới
 * sát mép. Android cắt icon maskable thành hình tròn, ăn mất khoảng 20% viền —
 * tức cụt hai đầu dây và dấu tích xanh. Icon chỉ được khai maskable khi hình
 * đã chừa sẵn lề an toàn.
 */

const goc = (p: string) => resolve(__dirname, '..', p);

/** Đọc kích thước thật từ phần đầu file PNG. */
const kichThuocPNG = (duong: string): { rong: number; cao: number } => {
  const b = readFileSync(duong);
  // 8 byte chữ ký + 4 byte độ dài + 4 byte "IHDR", rồi tới rộng và cao.
  return { rong: b.readUInt32BE(16), cao: b.readUInt32BE(20) };
};

interface Icon {
  src: string;
  sizes: string;
  type?: string;
  purpose?: string;
}

const manifest = JSON.parse(readFileSync(goc('public/manifest.json'), 'utf8')) as {
  icons: Icon[];
  name: string;
  start_url: string;
};

describe('manifest.json — icon phải khai đúng sự thật', () => {
  it('có ít nhất một icon', () => {
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  for (const icon of manifest.icons) {
    it(`${icon.src}: file có tồn tại`, () => {
      expect(existsSync(goc('public' + icon.src)), `thiếu file public${icon.src}`).toBe(true);
    });

    it(`${icon.src}: kích thước khai báo khớp ảnh thật`, () => {
      const that = kichThuocPNG(goc('public' + icon.src));
      const khai = icon.sizes.split('x').map(Number);
      expect(
        [that.rong, that.cao],
        `manifest khai ${icon.sizes} nhưng ảnh thật là ${that.rong}x${that.cao}`
      ).toEqual(khai);
    });

    it(`${icon.src}: không khai maskable khi hình chưa chừa lề an toàn`, () => {
      // Icon hiện tại vẽ phủ kín tới sát mép. Khi nào có bản riêng đã chừa lề
      // (nội dung nằm trong vòng tròn giữa, chiếm khoảng 80%) thì mới thêm một
      // mục icon riêng với purpose "maskable".
      expect(icon.purpose || 'any').not.toContain('maskable');
    });
  }

  it('Chrome cài được: phải có icon từ 192px trở lên', () => {
    const duLon = manifest.icons.some((i) => Number(i.sizes.split('x')[0]) >= 192);
    expect(duLon, 'không có icon nào đạt 192px').toBe(true);
  });
});

describe('index.html — icon không được dẫn từ máy chủ người khác', () => {
  const html = readFileSync(goc('index.html'), 'utf8');

  it('apple-touch-icon trỏ vào file trong chính dự án', () => {
    // TRƯỚC ĐÂY trỏ tới raw.githubusercontent.com: icon của app phụ thuộc vào
    // một kho mã của người khác — đổi tên, đổi nhánh, xoá file, hay GitHub
    // chặn dẫn ảnh là icon mất.
    const khop = html.match(/rel="apple-touch-icon"\s+href="([^"]+)"/);
    expect(khop, 'không tìm thấy thẻ apple-touch-icon').toBeTruthy();
    expect(khop![1], 'apple-touch-icon đang trỏ ra ngoài').toMatch(/^\//);
  });
});
