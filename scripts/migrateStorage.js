/**
 * Chuyển file (PDF, ảnh) từ Storage của project cũ sang project hiện tại.
 *
 * VÌ SAO CẦN: khi chuyển project Firebase, script importData.js chỉ chuyển
 * BẢN GHI trong Firestore. File thật vẫn nằm ở Storage của project cũ, và các
 * bản ghi mới vẫn trỏ link về đó. Tải xuống vẫn chạy vì link công khai, nhưng:
 *
 *   - Xoá project cũ là mất sạch tài liệu và ảnh bìa
 *   - Hoá đơn băng thông vẫn tính vào project cũ
 *
 * Script này tải từng file về, đẩy lên Storage mới, rồi cập nhật lại link
 * trong Firestore.
 *
 * Ba chỗ chứa link cần xử lý:
 *   - documents.downloadUrl   (file tài liệu)
 *   - blogPosts.coverImage    (ảnh bìa bài viết)
 *   - blogPosts.content       (ảnh chèn trong nội dung bài)
 *
 * Cách chạy:
 *   node scripts/migrateStorage.js --key "C:/duong/dan/khoa.json" --dry-run
 *   node scripts/migrateStorage.js --key "C:/duong/dan/khoa.json"
 */

import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// ─── Tham số ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const layThamSo = (ten) => {
  const i = args.indexOf(ten);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};
const duongDanKhoa = layThamSo('--key');
const chayThu = args.includes('--dry-run');

if (!duongDanKhoa || !fs.existsSync(duongDanKhoa)) {
  console.error('❌ Thiếu hoặc sai --key. Ví dụ:');
  console.error('   node scripts/migrateStorage.js --key "C:/Users/Admin/Downloads/khoa.json"');
  process.exit(1);
}

const khoa = JSON.parse(fs.readFileSync(duongDanKhoa, 'utf8'));
const BUCKET_MOI = `${khoa.project_id}.firebasestorage.app`;

initializeApp({ credential: cert(khoa), storageBucket: BUCKET_MOI });
const db = getFirestore();
const bucket = getStorage().bucket();

/** Nhận diện link Storage trỏ về một bucket KHÁC bucket hiện tại. */
const LA_LINK_STORAGE = /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/([^/]+)\/o\/([^?"'\s)]+)([^"'\s)]*)/g;

/**
 * Tải một file từ link cũ rồi đẩy lên bucket mới, trả về link mới.
 * Đường dẫn trong bucket giữ nguyên như cũ để dễ đối chiếu.
 */
const chuyenMotFile = async (linkCu, duongDanTrongBucket) => {
  const res = await fetch(linkCu);
  if (!res.ok) throw new Error(`tải về lỗi ${res.status}`);

  const duLieu = Buffer.from(await res.arrayBuffer());
  const loaiFile = res.headers.get('content-type') || 'application/octet-stream';

  const file = bucket.file(duongDanTrongBucket);
  // Dùng lại một token cố định để link tải công khai ổn định.
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await file.save(duLieu, {
    metadata: {
      contentType: loaiFile,
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  const duongDanMaHoa = encodeURIComponent(duongDanTrongBucket);
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET_MOI}/o/${duongDanMaHoa}?alt=media&token=${token}`;
};

let daChuyen = 0;
let daBoQua = 0;
let loi = 0;
const daLamRoi = new Map(); // link cũ -> link mới, tránh tải trùng

/** Thay mọi link Storage cũ trong một chuỗi bằng link mới. */
const thayLinkTrongChuoi = async (chuoi) => {
  if (typeof chuoi !== 'string' || !chuoi.includes('firebasestorage.googleapis.com')) {
    return { chuoiMoi: chuoi, coDoi: false };
  }

  let chuoiMoi = chuoi;
  let coDoi = false;
  const cacLink = [...chuoi.matchAll(LA_LINK_STORAGE)];

  for (const khop of cacLink) {
    const [linkDayDu, bucketCu, duongDanMaHoa] = khop;

    if (bucketCu === BUCKET_MOI) {
      daBoQua++;
      continue; // đã ở bucket mới rồi
    }

    if (daLamRoi.has(linkDayDu)) {
      chuoiMoi = chuoiMoi.replace(linkDayDu, daLamRoi.get(linkDayDu));
      coDoi = true;
      continue;
    }

    const duongDan = decodeURIComponent(duongDanMaHoa);

    if (chayThu) {
      console.log(`   👀 sẽ chuyển: ${duongDan.slice(0, 70)}`);
      daChuyen++;
      continue;
    }

    try {
      const linkMoi = await chuyenMotFile(linkDayDu, duongDan);
      daLamRoi.set(linkDayDu, linkMoi);
      chuoiMoi = chuoiMoi.replace(linkDayDu, linkMoi);
      coDoi = true;
      daChuyen++;
      console.log(`   ✅ ${duongDan.slice(0, 70)}`);
    } catch (err) {
      loi++;
      console.error(`   ❌ ${duongDan.slice(0, 50)}: ${err.message}`);
    }
  }

  return { chuoiMoi, coDoi };
};

// ─── Chạy ────────────────────────────────────────────────────────────────
console.log(`\n📦 Chuyển file sang bucket: ${BUCKET_MOI}`);
console.log(`   Chế độ: ${chayThu ? 'CHẠY THỬ (không tải, không ghi)' : 'CHẠY THẬT'}\n`);

const congViec = [
  { bang: 'documents', truong: ['downloadUrl'] },
  { bang: 'blogPosts', truong: ['coverImage', 'content'] },
];

for (const { bang, truong } of congViec) {
  const snap = await db.collection(bang).get();
  console.log(`── ${bang}: ${snap.size} bản ghi`);

  for (const doc of snap.docs) {
    const duLieu = doc.data();
    const capNhat = {};

    for (const ten of truong) {
      const { chuoiMoi, coDoi } = await thayLinkTrongChuoi(duLieu[ten]);
      if (coDoi) capNhat[ten] = chuoiMoi;
    }

    if (Object.keys(capNhat).length > 0 && !chayThu) {
      await doc.ref.update(capNhat);
      console.log(`   💾 cập nhật link: ${doc.id}`);
    }
  }
  console.log('');
}

console.log('─'.repeat(50));
console.log(
  `Tổng kết: ${daChuyen} file${chayThu ? ' (mới chỉ chạy thử)' : ' đã chuyển'} · ${daBoQua} đã ở bucket mới · ${loi} lỗi`
);
console.log('\nLưu ý: file gốc ở project cũ KHÔNG bị xoá.');

if (loi > 0) process.exit(1);
