import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * File khai báo chỉ mục Firestore phải đúng và phải thật sự được deploy.
 *
 * Bối cảnh: Firestore đòi "chỉ mục ghép" cho các truy vấn lọc nhiều trường rồi
 * sắp xếp. Thiếu chỉ mục thì truy vấn KHÔNG hỏng lúc build, cũng không hỏng
 * trong test — nó hỏng đúng lúc người dùng thật mở trang.
 *
 * HAI VIỆC ĐÃ ĐO ĐƯỢC:
 *  - Máy chủ atld-connect có 7 chỉ mục, file nguồn chỉ khai 6. Cái lệch là
 *    blogPosts(category+published+publishedAt) — tạo tay trên Console lúc gặp
 *    lỗi rồi quên ghi lại vào mã.
 *  - CI chỉ deploy `firestore:rules`, chưa bao giờ deploy `firestore:indexes`.
 *    Nghĩa là thêm chỉ mục vào file cũng không lên tới máy chủ.
 *
 * Test này không gọi được máy chủ, nên nó canh phần canh được: file hợp lệ,
 * không trùng lặp, và quy trình CI có bước deploy chỉ mục.
 */

const goc = (p: string) => resolve(__dirname, '..', p);
const doc = (p: string) => readFileSync(goc(p), 'utf8');

interface TruongChiMuc {
  fieldPath: string;
  order?: string;
  arrayConfig?: string;
}
interface ChiMuc {
  collectionGroup: string;
  queryScope: string;
  fields: TruongChiMuc[];
}

const cauHinh = JSON.parse(doc('firestore.indexes.json')) as {
  indexes: ChiMuc[];
  fieldOverrides: unknown[];
};

const chuKy = (c: ChiMuc) =>
  `${c.collectionGroup}: ${c.fields.map((f) => `${f.fieldPath}(${f.order || f.arrayConfig})`).join(' + ')}`;

describe('firestore.indexes.json', () => {
  it('mỗi chỉ mục đều đủ collectionGroup, queryScope và ít nhất 2 trường', () => {
    for (const c of cauHinh.indexes) {
      expect(c.collectionGroup, 'thiếu collectionGroup').toBeTruthy();
      expect(c.queryScope, `${c.collectionGroup} thiếu queryScope`).toBeTruthy();
      // Chỉ mục ghép mà chỉ có 1 trường thì thừa — Firestore tự có sẵn.
      expect(c.fields.length, `${chuKy(c)} chỉ có 1 trường`).toBeGreaterThanOrEqual(2);
    }
  });

  it('không khai trường __name__ (Firestore tự thêm)', () => {
    for (const c of cauHinh.indexes) {
      const thua = c.fields.filter((f) => f.fieldPath === '__name__');
      expect(thua, `${chuKy(c)} khai thừa __name__`).toEqual([]);
    }
  });

  it('không có chỉ mục nào trùng nhau', () => {
    const ds = cauHinh.indexes.map(chuKy);
    const trung = ds.filter((x, i) => ds.indexOf(x) !== i);
    expect([...new Set(trung)], `trùng: ${trung.join(', ')}`).toEqual([]);
  });

  it('có đủ chỉ mục cho các truy vấn đang dùng thật', () => {
    const ds = cauHinh.indexes.map(chuKy);
    const canCo = [
      // ChatPage: phòng chat của tôi, mới nhất lên đầu
      'chatRooms: clientId(ASCENDING) + lastMessageTime(DESCENDING)',
      'chatRooms: partnerId(ASCENDING) + lastMessageTime(DESCENDING)',
      // ChatWindow: tin nhắn trong một phòng, theo thứ tự thời gian
      'chatMessages: roomId(ASCENDING) + createdAt(ASCENDING)',
      // BlogDetailPage: bài liên quan cùng chuyên mục
      'blogPosts: category(ASCENDING) + published(ASCENDING) + publishedAt(DESCENDING)',
    ];
    for (const c of canCo) {
      expect(ds, `thiếu chỉ mục: ${c}`).toContain(c);
    }
  });
});

describe('quy trình CI', () => {
  const quyTrinh = doc('.github/workflows/deploy-hosting.yml');

  it('có bước deploy chỉ mục Firestore', () => {
    // Thiếu bước này thì file trên là giấy tờ suông: khai bao nhiêu cũng không
    // tới được máy chủ, và truy vấn mới sẽ vỡ với người dùng thật.
    expect(quyTrinh).toMatch(/--only\s+firestore:indexes/);
  });

  it('KHÔNG dùng --force khi deploy chỉ mục', () => {
    // --force cho phép XOÁ chỉ mục có trên máy chủ mà không có trong file.
    // Xoá nhầm một chỉ mục đang dùng là hỏng truy vấn ngay lập tức.
    const khoi = quyTrinh.slice(quyTrinh.indexOf('firestore:indexes'));
    const denBuocSau = khoi.slice(0, khoi.indexOf('- name:', 10));
    expect(denBuocSau).not.toMatch(/--force/);
  });

  it('vẫn giữ bước deploy rules', () => {
    expect(quyTrinh).toMatch(/--only\s+firestore:rules/);
  });
});
