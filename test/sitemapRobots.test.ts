import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Sitemap và robots.txt phải nói cùng một chuyện.
 *
 * Lỗi đã xảy ra thật: robots.txt ghi `Disallow: /requests`, mà sitemap.xml lại
 * khai `/requests` cho Google. Vừa bảo "đừng vào" vừa bảo "vào đây mà xem" —
 * Google Search Console báo lỗi "Indexed, though blocked by robots.txt".
 *
 * Danh sách trang lại nằm ở BỐN chỗ khác nhau (script build, Cloud Function,
 * một công cụ trong trang quản trị, và một file tiện ích). Sửa một chỗ mà quên
 * ba chỗ kia là chuyện đã lặp lại nhiều lần trong dự án này — nên test soát cả
 * bốn.
 */

const goc = (duong: string) => resolve(__dirname, '..', duong);
const doc = (duong: string) => readFileSync(goc(duong), 'utf8');

/** Các đường dẫn bị chặn trong robots.txt. */
const layDuongBiChan = (robots: string): string[] => {
  const ds = [...robots.matchAll(/^\s*Disallow:\s*(\S+)\s*$/gim)].map((m) => m[1]);
  return [...new Set(ds)].filter((d) => d !== '/' && d.length > 1);
};

const NGUON_SITEMAP = [
  'scripts/generateSitemap.js',
  'functions/index.js',
  'components/SitemapGenerator.tsx',
  'utils/generateSitemap.ts',
];

describe('sitemap và robots.txt không được mâu thuẫn nhau', () => {
  const robots = doc('public/robots.txt');
  const biChan = layDuongBiChan(robots);

  it('robots.txt thật sự có chặn vài đường (nếu không thì test này vô nghĩa)', () => {
    expect(biChan.length).toBeGreaterThan(0);
  });

  for (const nguon of NGUON_SITEMAP) {
    it(`${nguon} không khai đường nào đang bị robots.txt chặn`, () => {
      const ma = doc(nguon);

      // Chỉ soi các dòng KHAI đường dẫn, bỏ qua chú thích — chú thích có nhắc
      // tên đường dẫn để giải thích vì sao loại chúng ra.
      const dongKhai = ma
        .split('\n')
        .filter((d) => !d.trim().startsWith('//') && !d.trim().startsWith('*'))
        .join('\n');

      const viPham = biChan.filter((duong) => {
        const khaiKieuUrl = new RegExp(`url:\\s*['"\`]${duong}['"\`]`).test(dongKhai);
        const khaiKieuLoc = new RegExp(`\\$\\{SITE_URL\\}${duong}['"\`]`).test(dongKhai);
        return khaiKieuUrl || khaiKieuLoc;
      });

      expect(viPham, `${nguon} khai ${viPham.join(', ')} dù robots.txt đã chặn`).toEqual([]);
    });
  }
});

describe('sitemap.xml đã sinh ra cũng phải sạch', () => {
  it('file public/sitemap.xml không chứa đường bị chặn', () => {
    const robots = doc('public/robots.txt');
    const biChan = layDuongBiChan(robots);
    const xml = doc('public/sitemap.xml');

    const cacLoc = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
      m[1].replace(/^https?:\/\/[^/]+/, '')
    );

    const viPham = cacLoc.filter((d) => biChan.includes(d));
    expect(viPham, `sitemap.xml còn ${viPham.join(', ')}`).toEqual([]);
  });
});
