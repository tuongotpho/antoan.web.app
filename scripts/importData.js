/**
 * Nhập dữ liệu đã sao lưu từ project cũ sang project hiện tại.
 *
 * Dùng khi chuyển project Firebase: bản sao lưu trong migration-backup/ được
 * xuất ra bằng Firestore REST nên còn ở dạng "có gắn nhãn kiểu"
 * ({stringValue: "..."}), phải chuyển về giá trị thường trước khi ghi lại.
 *
 * MẶC ĐỊNH KHÔNG GHI ĐÈ: bản ghi nào đã có ở project mới thì bỏ qua, để không
 * lỡ tay đè lên nội dung đang chạy. Muốn đè thì thêm --overwrite.
 *
 * Cách chạy (đường dẫn khoá là file JSON service account tải từ Firebase Console):
 *
 *   node scripts/importData.js --key "C:/duong/dan/khoa.json"
 *   node scripts/importData.js --key "..." --dry-run     # chỉ xem trước, không ghi
 *   node scripts/importData.js --key "..." --overwrite   # ghi đè bản ghi trùng
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const THU_MUC_SAO_LUU = path.join(__dirname, '..', 'migration-backup');

// ─── Đọc tham số dòng lệnh ───────────────────────────────────────────────
const args = process.argv.slice(2);
const layThamSo = (ten) => {
  const i = args.indexOf(ten);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};
const duongDanKhoa = layThamSo('--key');
const chayThu = args.includes('--dry-run');
const ghiDe = args.includes('--overwrite');

if (!duongDanKhoa) {
  console.error('❌ Thiếu --key. Ví dụ:');
  console.error('   node scripts/importData.js --key "C:/Users/Admin/Downloads/khoa.json"');
  process.exit(1);
}
if (!fs.existsSync(duongDanKhoa)) {
  console.error(`❌ Không thấy file khoá: ${duongDanKhoa}`);
  process.exit(1);
}

/**
 * Chuyển một giá trị Firestore REST về giá trị JavaScript thường.
 *
 * REST bọc mọi giá trị trong một nhãn kiểu — {stringValue: "abc"} thay vì "abc"
 * — và bọc lồng nhau với mảng/đối tượng, nên phải gỡ đệ quy.
 */
const doiGiaTri = (v) => {
  if (v === null || v === undefined) return null;
  if ('nullValue' in v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  // integerValue về dưới dạng chuỗi để không mất số lớn
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('timestampValue' in v) return Timestamp.fromDate(new Date(v.timestampValue));
  if ('bytesValue' in v) return Buffer.from(v.bytesValue, 'base64');
  if ('geoPointValue' in v) return v.geoPointValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(doiGiaTri);
  if ('mapValue' in v) return doiBanGhi(v.mapValue.fields || {});
  // referenceValue trỏ sang project cũ nên giữ nguyên dạng chuỗi, không dựng
  // lại thành tham chiếu — dựng lại sẽ trỏ sai nơi.
  if ('referenceValue' in v) return v.referenceValue;
  return null;
};

const doiBanGhi = (fields) => {
  const ra = {};
  for (const [khoa, giaTri] of Object.entries(fields)) {
    ra[khoa] = doiGiaTri(giaTri);
  }
  return ra;
};

/** Lấy id tài liệu từ trường name đầy đủ của REST. */
const layId = (name) => (name || '').split('/').pop();

/**
 * Đọc file sao lưu. Hai định dạng khác nhau tuỳ cách xuất:
 *   - runQuery  → mảng [{document: {...}}, ...]
 *   - list      → đối tượng {documents: [...]}
 */
const docFileSaoLuu = (tenFile) => {
  const duongDan = path.join(THU_MUC_SAO_LUU, tenFile);
  if (!fs.existsSync(duongDan)) {
    console.warn(`⚠️  Bỏ qua: không thấy ${tenFile}`);
    return [];
  }
  // Bỏ BOM nếu có: file sao lưu được ghi bằng PowerShell, mà Out-File -Encoding
  // utf8 trên Windows PowerShell 5.1 luôn chèn BOM ở đầu — JSON.parse gặp ký tự
  // đó là báo lỗi cú pháp ngay ký tự thứ nhất.
  // Viết  dưới dạng mã thay vì dán thẳng ký tự BOM: dán thẳng thì chính
  // file mã nguồn này chứa một ký tự trắng vô hình, và eslint chặn
  // (no-irregular-whitespace).
  const thô = fs.readFileSync(duongDan, 'utf8').replace(/^\uFEFF/, '');
  const noiDung = JSON.parse(thô);
  const dsThô = Array.isArray(noiDung)
    ? noiDung.map((m) => m.document).filter(Boolean)
    : noiDung.documents || [];

  return dsThô.map((d) => ({ id: layId(d.name), duLieu: doiBanGhi(d.fields || {}) }));
};

// ─── Chạy ────────────────────────────────────────────────────────────────
const khoa = JSON.parse(fs.readFileSync(duongDanKhoa, 'utf8'));
initializeApp({ credential: cert(khoa) });
const db = getFirestore();

console.log(`\n📦 Nhập dữ liệu vào project: ${khoa.project_id}`);
console.log(`   Chế độ: ${chayThu ? 'CHẠY THỬ (không ghi gì)' : ghiDe ? 'GHI ĐÈ bản trùng' : 'BỎ QUA bản trùng'}\n`);

const cacBang = [
  { tenFile: 'blogPosts.json', bang: 'blogPosts' },
  { tenFile: 'documents.json', bang: 'documents' },
];

let tongMoi = 0;
let tongBoQua = 0;
let tongLoi = 0;

for (const { tenFile, bang } of cacBang) {
  const banGhi = docFileSaoLuu(tenFile);
  if (banGhi.length === 0) continue;

  console.log(`── ${bang}: ${banGhi.length} bản ghi trong sao lưu`);

  for (const { id, duLieu } of banGhi) {
    const ref = db.collection(bang).doc(id);
    try {
      const dangCo = await ref.get();

      if (dangCo.exists && !ghiDe) {
        console.log(`   ⏭️  bỏ qua (đã có): ${id}`);
        tongBoQua++;
        continue;
      }

      if (chayThu) {
        console.log(`   👀 sẽ ${dangCo.exists ? 'ghi đè' : 'thêm mới'}: ${id}`);
        tongMoi++;
        continue;
      }

      await ref.set(duLieu);
      console.log(`   ✅ ${dangCo.exists ? 'đã ghi đè' : 'đã thêm'}: ${id}`);
      tongMoi++;
    } catch (err) {
      console.error(`   ❌ lỗi với ${id}: ${err.message}`);
      tongLoi++;
    }
  }
  console.log('');
}

console.log('─'.repeat(50));
console.log(`Tổng kết: ${tongMoi} ghi${chayThu ? ' (mới chỉ chạy thử)' : ''} · ${tongBoQua} bỏ qua · ${tongLoi} lỗi`);

if (tongLoi > 0) process.exit(1);
