import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

/**
 * Nhãn đọc cho người khiếm thị (aria-label) phải bằng tiếng Việt.
 *
 * Đây là nhãn mà trình đọc màn hình ĐỌC THÀNH TIẾNG. Người dùng Việt Nam nghe
 * "Close menu" giữa một trang toàn tiếng Việt thì không hiểu — mà họ lại không
 * nhìn thấy biểu tượng để đoán.
 *
 * Đã sửa dần qua nhiều lượt và LẦN NÀO CŨNG SÓT: "Toggle menu" trên nút mở
 * menu, rồi "Close menu" trên nút đóng ngay bên trong menu đó, rồi "Close",
 * "Previous image", "Next image" trong khung xem ảnh. Nên chốt lại bằng test.
 */

const GOC = resolve(__dirname, '..');
const BO_QUA = new Set(['node_modules', 'dist', '.git', 'functions', 'test', 'scripts']);

/**
 * Vài từ tiếng Anh đã thành tiếng Việt thông dụng, đọc lên ai cũng hiểu.
 * Không tính là vi phạm.
 */
const TU_DUOC_PHEP = new Set([
  'email',
  'website',
  'blog',
  'logo',
  'video',
  'menu',
  'facebook',
  'zalo',
  'telegram',
  'seo',
  'pdf',
  'form',
]);

const CO_DAU_TIENG_VIET =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂÂÈÉẺẼẸÊÌÍÒÓÔƠÙÚƯỲĐ]/;

const duyetFile = (thuMuc: string, ketQua: string[] = []): string[] => {
  for (const ten of readdirSync(thuMuc)) {
    if (BO_QUA.has(ten) || ten.startsWith('.')) continue;
    const duong = join(thuMuc, ten);
    if (statSync(duong).isDirectory()) duyetFile(duong, ketQua);
    else if (/\.tsx$/.test(ten)) ketQua.push(duong);
  }
  return ketQua;
};

describe('nhãn cho trình đọc màn hình phải bằng tiếng Việt', () => {
  it('không còn aria-label nào viết bằng tiếng Anh', () => {
    const viPham: string[] = [];

    for (const duong of duyetFile(GOC)) {
      const dong = readFileSync(duong, 'utf8').split('\n');
      dong.forEach((d, i) => {
        // Chỉ soát nhãn viết thẳng bằng chuỗi; nhãn ghép động thì bỏ qua.
        const khop = d.match(/aria-label="([^"{]+)"/);
        if (!khop) return;

        const nhan = khop[1].trim();
        if (!nhan) return;
        if (CO_DAU_TIENG_VIET.test(nhan)) return; // rõ ràng là tiếng Việt

        // Nhãn không dấu: chấp nhận nếu MỌI từ đều nằm trong danh sách cho phép
        // (ví dụ "Email", "Website"). Còn "Close menu" thì không.
        const tu = nhan.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
        if (tu.length > 0 && tu.every((t) => TU_DUOC_PHEP.has(t))) return;

        viPham.push(`${relative(GOC, duong)}:${i + 1} → "${nhan}"`);
      });
    }

    expect(viPham, `nhãn tiếng Anh còn ở: ${viPham.join(' | ')}`).toEqual([]);
  });
});
