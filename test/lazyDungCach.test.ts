import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

/**
 * Mọi chỗ nạp mã theo yêu cầu đều phải đi qua lazyCoTaiLai, không được dùng
 * React.lazy trần.
 *
 * Vì sao: sau mỗi lần deploy, tên các mảnh mã đổi theo nội dung. Người đang mở
 * sẵn trang từ trước sẽ đi tìm một file không còn tồn tại, và nhận
 * "Failed to fetch dynamically imported module" — màn hình lỗi thay vì trang.
 * lazyCoTaiLai bắt đúng lỗi đó rồi tải lại trang một lần.
 *
 * LỖI ĐÃ XẢY RA THẬT: router.tsx dùng lazyCoTaiLai cho cả 10 trang, nhưng
 * App.tsx lại còn một dòng React.lazy trần cho LoginModal. Nhật ký trình duyệt
 * trên antoan.web.app ghi đúng lỗi trên với file LoginModal-DN4Q929W.js. Bỏ sót
 * đúng cửa vào của mọi thứ.
 */

const GOC = resolve(__dirname, '..');
const BO_QUA = new Set(['node_modules', 'dist', '.git', 'functions', 'test', 'scripts']);

const duyetFile = (thuMuc: string, ketQua: string[] = []): string[] => {
  for (const ten of readdirSync(thuMuc)) {
    if (BO_QUA.has(ten) || ten.startsWith('.')) continue;
    const duong = join(thuMuc, ten);
    if (statSync(duong).isDirectory()) duyetFile(duong, ketQua);
    else if (/\.tsx?$/.test(ten)) ketQua.push(duong);
  }
  return ketQua;
};

describe('nạp mã theo yêu cầu phải chịu được việc deploy', () => {
  it('không file nào còn dùng React.lazy trần', () => {
    const viPham: string[] = [];

    for (const duong of duyetFile(GOC)) {
      // Bỏ qua chính file định nghĩa lazyCoTaiLai — nó buộc phải gọi React.lazy.
      if (duong.endsWith('lazyCoTaiLai.ts')) continue;

      const dong = readFileSync(duong, 'utf8').split('\n');
      dong.forEach((d, i) => {
        if (d.trim().startsWith('//') || d.trim().startsWith('*')) return;
        // Bắt cả `lazy(` lẫn `React.lazy(`, nhưng KHÔNG bắt `lazyCoTaiLai(`.
        if (/(^|[^A-Za-z0-9_])(React\.)?lazy\s*\(/.test(d) && !/lazyCoTaiLai\s*\(/.test(d)) {
          viPham.push(`${relative(GOC, duong)}:${i + 1}`);
        }
      });
    }

    expect(viPham, `dùng React.lazy trần tại: ${viPham.join(', ')}`).toEqual([]);
  });
});
