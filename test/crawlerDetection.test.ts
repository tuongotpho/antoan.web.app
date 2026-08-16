import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Kiểm phần nhận diện bot và cách đặt cache của các hàm phục vụ thẻ meta.
 *
 * Đọc thẳng từ functions/index.js thay vì import, vì file đó gọi initializeApp()
 * ngay khi nạp nên không import vào test được.
 */

const nguonFunctions = fs.readFileSync(
  path.resolve(__dirname, '..', 'functions', 'index.js'),
  'utf8'
);

const layDanhSachBot = (): string[] => {
  const khop = nguonFunctions.match(/const CRAWLER_USER_AGENTS = \[([\s\S]*?)\];/);
  if (!khop) throw new Error('Không tìm thấy CRAWLER_USER_AGENTS trong functions/index.js');
  return khop[1]
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
};

const laBot = (ua: string): boolean =>
  layDanhSachBot().some((bot) => ua.toLowerCase().includes(bot.toLowerCase()));

describe('nhận diện bot — trình duyệt thật KHÔNG được coi là bot', () => {
  // Nhận nhầm người dùng thành bot là họ nhận trang thẻ meta, mà trang đó có
  // lệnh tự chuyển hướng về chính địa chỉ đang mở — thành vòng lặp.
  const trinhDuyetThat: Record<string, string> = {
    'Chrome máy tính':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Chrome Android':
      'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Safari iPhone':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Safari máy tính':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    Firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    Edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    'Cốc Cốc':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/120.0.0.0 Chrome/114.0.0.0 Safari/537.36',
  };

  for (const [ten, ua] of Object.entries(trinhDuyetThat)) {
    it(`${ten} phải được coi là người dùng`, () => {
      expect(laBot(ua)).toBe(false);
    });
  }
});

describe('nhận diện bot — bot phải được nhận ra', () => {
  const cacBot: Record<string, string> = {
    Facebook: 'facebookexternalhit/1.1',
    Google: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    Zalo: 'Zalobot/1.0',
    Telegram: 'TelegramBot (like TwitterBot)',
    Twitter: 'Twitterbot/1.0',
    LinkedIn: 'LinkedInBot/1.0',
    ChatGPT: 'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)',
  };

  for (const [ten, ua] of Object.entries(cacBot)) {
    it(`bot ${ten} phải được nhận ra`, () => {
      expect(laBot(ua)).toBe(true);
    });
  }
});

describe('cách đặt cache của các hàm phục vụ thẻ meta', () => {
  it('có khai báo Vary: User-Agent', () => {
    // Thiếu dòng này thì CDN dùng chung một bản cache cho cả bot lẫn người dùng.
    // Bot ghé trước là người dùng thật nhận trang chuyển hướng vòng lặp.
    expect(nguonFunctions).toMatch(/res\.set\(\s*['"]Vary['"]\s*,\s*['"]User-Agent['"]\s*\)/);
  });

  it('không còn chỗ nào đặt Cache-Control công khai mà quên Vary', () => {
    const dongCacheCongKhai = nguonFunctions
      .split('\n')
      .filter((d) => /Cache-Control['"]\s*,\s*['"]public/.test(d));
    // Mọi chỗ đặt cache công khai đều phải đi qua datThongTinCache()
    expect(dongCacheCongKhai).toHaveLength(0);
  });

  it('hàm phục vụ ứng dụng cho trình duyệt cũng đặt Vary', () => {
    const than = nguonFunctions.match(
      /async function serveSPAForBrowser\(res\)\s*\{[\s\S]*?\n\}/
    );
    expect(than).not.toBeNull();
    expect(than![0]).toMatch(/Vary/);
  });
});
