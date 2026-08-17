import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Tra cứu bảng lĩnh vực huấn luyện bằng đoạn lấy từ đường dẫn phải an toàn.
 *
 * Đối tượng thường trong JavaScript mang sẵn một số tên có từ trước —
 * `constructor`, `toString`, `valueOf`, `hasOwnProperty`... Tra cứu bằng những
 * tên đó KHÔNG trả về undefined mà trả về hàm dựng sẵn, nên lọt qua kiểm tra
 * "không tìm thấy".
 *
 * ĐÃ ĐO ĐƯỢC TRÊN BẢN CHẠY THẬT:
 *   - Cloud Function: /training/constructor, /training/toString và
 *     /training/valueOf đều trả HTTP 200 với trang rỗng tiêu đề
 *     (`<title> | SafetyConnect</title>`), trong khi /training/khong-co-that
 *     chuyển hướng đúng. Google có thể index những địa chỉ rác đó.
 *   - Phía trình duyệt: mở /training/constructor thì trang VỠ, lưới chắn lỗi
 *     bung ra màn hình "Đã xảy ra lỗi".
 */

const doc = (duong: string) => readFileSync(resolve(__dirname, '..', duong), 'utf8');

/** Tên có sẵn trên mọi đối tượng thường — chính là các đầu vào phá được. */
const TEN_CO_SAN = ['constructor', 'toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf'];

describe('bảng lĩnh vực: tên có sẵn của JavaScript không được coi là lĩnh vực thật', () => {
  it('mô phỏng cách tra cứu CŨ — chứng minh nó thật sự hỏng', () => {
    const bang: Record<string, { title: string }> = {
      'an-toan-dien': { title: 'An toàn điện' },
    };
    for (const ten of TEN_CO_SAN) {
      // Đây là lý do lỗi xảy ra: giá trị trả về KHÁC undefined.
      expect(
        (bang as Record<string, unknown>)[ten],
        `"${ten}" đáng lẽ phải là undefined`
      ).not.toBeUndefined();
    }
  });

  it('cách tra cứu MỚI loại đúng các tên có sẵn, vẫn nhận lĩnh vực thật', () => {
    const bang: Record<string, { title: string }> = {
      'an-toan-dien': { title: 'An toàn điện' },
    };
    const tra = (khoa: string) =>
      Object.prototype.hasOwnProperty.call(bang, khoa) ? bang[khoa] : undefined;

    for (const ten of TEN_CO_SAN) {
      expect(tra(ten), `"${ten}" vẫn lọt qua`).toBeUndefined();
    }
    expect(tra('an-toan-dien')).toEqual({ title: 'An toàn điện' });
    expect(tra('khong-co-that')).toBeUndefined();
  });
});

describe('cả hai nơi tra cứu bảng lĩnh vực đều phải dùng hasOwnProperty', () => {
  const NOI = [
    'functions/index.js', // Cloud Function dựng thẻ meta cho Google
    'pages/TrainingLandingPage.tsx', // trang hiển thị cho người dùng
  ];

  for (const noi of NOI) {
    it(`${noi}: mọi lần tra bảng đều nằm sau một lớp chắn hasOwnProperty`, () => {
      const dong = doc(noi).split('\n');

      // Phép chắn thường viết bằng toán tử ba ngôi trải trên nhiều dòng, nên
      // KHÔNG soát theo từng dòng riêng lẻ được — phải nhìn cả cụm quanh đó.
      const viPham: string[] = [];
      dong.forEach((d, i) => {
        if (d.trim().startsWith('//') || d.trim().startsWith('*')) return;
        if (!/trainingData\[\s*(trainingType|params|type)\b/.test(d)) return;

        const cum = dong.slice(Math.max(0, i - 4), i + 2).join('\n');
        if (!/hasOwnProperty\.call\(\s*trainingData/.test(cum)) {
          viPham.push(`${noi}:${i + 1}`);
        }
      });

      expect(viPham, `tra bảng không có lớp chắn tại: ${viPham.join(', ')}`).toEqual([]);
    });

    it(`${noi} có gọi hasOwnProperty khi tra bảng lĩnh vực`, () => {
      expect(doc(noi)).toMatch(/hasOwnProperty\.call\(\s*trainingData/);
    });
  }
});
