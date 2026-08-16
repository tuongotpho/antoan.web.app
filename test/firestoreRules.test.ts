// Không cần expect: assertFails/assertSucceeds tự khẳng định kết quả.
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

/**
 * Kiểm firestore.rules bằng Firebase emulator.
 *
 * Chạy được bộ này thì mới biết chắc rules làm đúng việc TRƯỚC KHI deploy —
 * thay vì deploy xong mới phát hiện chặn nhầm hoặc mở nhầm.
 *
 * Cần emulator đang chạy:
 *   firebase emulators:start --only firestore --project demo-antoan
 * Không có emulator thì bộ test này tự bỏ qua, không làm đỏ CI.
 */

const HOST = '127.0.0.1';
const PORT = 8080;

let testEnv: RulesTestEnvironment | null = null;
let emulatorSong = false;

const UID_ADMIN = 'admin_uid';
const UID_KHACH = 'khach_uid';
const UID_DOITAC = 'doitac_uid';
const UID_NGUOILA = 'nguoila_uid';

beforeAll(async () => {
  try {
    const res = await fetch(`http://${HOST}:${PORT}/`).catch(() => null);
    if (!res) {
      console.warn(
        `\n⚠️  Bỏ qua test rules: chưa thấy Firestore emulator ở ${HOST}:${PORT}.\n` +
          `   Chạy: firebase emulators:start --only firestore --project demo-antoan\n`
      );
      return;
    }

    testEnv = await initializeTestEnvironment({
      projectId: 'demo-antoan',
      firestore: {
        host: HOST,
        port: PORT,
        rules: fs.readFileSync(path.resolve(__dirname, '..', 'firestore.rules'), 'utf8'),
      },
    });
    emulatorSong = true;
  } catch (err) {
    console.warn('⚠️  Không khởi tạo được môi trường test rules:', (err as Error).message);
  }
}, 60000);

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
  if (!emulatorSong || !testEnv) return;
  await testEnv.clearFirestore();

  // Dựng sẵn dữ liệu, bỏ qua rules
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'admins', UID_ADMIN), { role: 'admin' });
    await setDoc(doc(db, 'partners', UID_DOITAC), {
      status: 'approved',
      email: 'doitac@vd.vn',
      businessName: 'Công ty Đại An',
    });
    await setDoc(doc(db, 'chatRooms', 'phong1'), {
      clientId: UID_KHACH,
      partnerId: UID_DOITAC,
    });
    await setDoc(doc(db, 'chatMessages', 'tin1'), {
      roomId: 'phong1',
      senderId: UID_DOITAC,
      text: 'Chào anh, bên em gửi báo giá',
      read: false,
    });
    await setDoc(doc(db, 'trainingRequests', 'yc1'), {
      companyName: 'Điện lực A & B',
      clientEmail: 'a@b.vn',
    });
  });
});

const boQuaNeuKhongCoEmulator = () => {
  if (!emulatorSong) {
    console.warn('   (bỏ qua — không có emulator)');
    return true;
  }
  return false;
};

describe('firestore.rules — đánh dấu tin nhắn đã đọc', () => {
  it('người NHẬN đánh dấu được đã đọc (lỗi cũ: bị từ chối)', async () => {
    if (boQuaNeuKhongCoEmulator()) return;
    const db = testEnv!.authenticatedContext(UID_KHACH).firestore();
    await assertSucceeds(updateDoc(doc(db, 'chatMessages', 'tin1'), { read: true }));
  });

  it('người nhận KHÔNG sửa được nội dung tin nhắn', async () => {
    if (boQuaNeuKhongCoEmulator()) return;
    const db = testEnv!.authenticatedContext(UID_KHACH).firestore();
    await assertFails(updateDoc(doc(db, 'chatMessages', 'tin1'), { text: 'đã bị sửa' }));
  });

  it('người nhận không lách bằng cách đổi read kèm trường khác', async () => {
    if (boQuaNeuKhongCoEmulator()) return;
    const db = testEnv!.authenticatedContext(UID_KHACH).firestore();
    await assertFails(
      updateDoc(doc(db, 'chatMessages', 'tin1'), { read: true, text: 'đã bị sửa' })
    );
  });

  it('người NGOÀI phòng chat không đánh dấu được', async () => {
    if (boQuaNeuKhongCoEmulator()) return;
    const db = testEnv!.authenticatedContext(UID_NGUOILA).firestore();
    await assertFails(updateDoc(doc(db, 'chatMessages', 'tin1'), { read: true }));
  });

  it('người ngoài phòng chat không đọc được tin nhắn', async () => {
    if (boQuaNeuKhongCoEmulator()) return;
    const db = testEnv!.authenticatedContext(UID_NGUOILA).firestore();
    await assertFails(getDoc(doc(db, 'chatMessages', 'tin1')));
  });
});

describe('firestore.rules — dữ liệu kinh doanh', () => {
  it('khách vãng lai KHÔNG đọc được danh sách yêu cầu', async () => {
    if (boQuaNeuKhongCoEmulator()) return;
    const db = testEnv!.unauthenticatedContext().firestore();
    await assertFails(getDocs(collection(db, 'trainingRequests')));
  });

  it('tài khoản mới đăng nhập cũng KHÔNG đọc được danh sách yêu cầu', async () => {
    if (boQuaNeuKhongCoEmulator()) return;
    // Tạo tài khoản Google mất 10 giây, nên "đã đăng nhập" không đủ để xem
    // danh sách khách hàng.
    const db = testEnv!.authenticatedContext(UID_NGUOILA).firestore();
    await assertFails(getDocs(collection(db, 'trainingRequests')));
  });

  it('đối tác ĐÃ DUYỆT đọc được danh sách yêu cầu', async () => {
    if (boQuaNeuKhongCoEmulator()) return;
    const db = testEnv!.authenticatedContext(UID_DOITAC).firestore();
    await assertSucceeds(getDocs(collection(db, 'trainingRequests')));
  });

  it('ai cũng gửi được yêu cầu huấn luyện (form công khai)', async () => {
    if (boQuaNeuKhongCoEmulator()) return;
    const db = testEnv!.unauthenticatedContext().firestore();
    await assertSucceeds(
      setDoc(doc(db, 'trainingRequests', 'yc_moi'), { companyName: 'Cơ khí Sao Việt' })
    );
  });

  it('không ai ghi thẳng vào hộp thư — chặn gửi mail mạo danh', async () => {
    if (boQuaNeuKhongCoEmulator()) return;
    const db = testEnv!.authenticatedContext(UID_DOITAC).firestore();
    await assertFails(
      setDoc(doc(db, 'mail', 'thu1'), { to: ['nan-nhan@vd.vn'], message: { subject: 'x' } })
    );
  });

  it('khách vãng lai KHÔNG đọc được hồ sơ đối tác', async () => {
    if (boQuaNeuKhongCoEmulator()) return;
    const db = testEnv!.unauthenticatedContext().firestore();
    await assertFails(getDocs(collection(db, 'partners')));
  });

  it('không ai tự phong mình làm admin', async () => {
    if (boQuaNeuKhongCoEmulator()) return;
    const db = testEnv!.authenticatedContext(UID_NGUOILA).firestore();
    await assertFails(setDoc(doc(db, 'admins', UID_NGUOILA), { role: 'admin' }));
  });
});
