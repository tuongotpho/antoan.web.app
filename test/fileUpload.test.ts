import { describe, it, expect } from 'vitest';
import {
  lamSachTenFile,
  formatFileSize,
  validateFile,
  getFileType,
} from '../utils/fileUpload';

/** Dựng một File giả để kiểm tra, không đụng tới ổ đĩa. */
const taoFile = (ten: string, kichThuoc: number, loai: string): File => {
  const f = new File(['x'], ten, { type: loai });
  Object.defineProperty(f, 'size', { value: kichThuoc });
  return f;
};

describe('lamSachTenFile', () => {
  it('bỏ phần đường dẫn để không tạo thư mục ngoài ý muốn', () => {
    // Chỉ giữ lại phần tên sau dấu gạch cuối cùng, giống lệnh basename.
    expect(lamSachTenFile('../../bimat/anh.png')).toBe('anh.png');
    expect(lamSachTenFile('C:\\Users\\Admin\\anh.png')).toBe('anh.png');
    // Không còn dấu gạch nào lọt vào đường dẫn Storage
    expect(lamSachTenFile('a/b/c/d.png')).not.toContain('/');
  });

  it('đổi dấu ? và # vốn làm hỏng địa chỉ tải về', () => {
    expect(lamSachTenFile('bao gia?v=2#moi.pdf')).toBe('bao_gia_v_2_moi.pdf');
  });

  it('giữ nguyên tiếng Việt có dấu', () => {
    expect(lamSachTenFile('hồ sơ an toàn.pdf')).toBe('hồ_sơ_an_toàn.pdf');
  });

  it('gộp nhiều gạch dưới liên tiếp', () => {
    expect(lamSachTenFile('a   b !!! c.png')).toBe('a_b_c.png');
  });

  it('cắt tên quá dài để đường dẫn không vượt giới hạn', () => {
    const dai = 'a'.repeat(300) + '.png';
    expect(lamSachTenFile(dai).length).toBeLessThanOrEqual(120);
  });

  it('không trả về chuỗi rỗng', () => {
    expect(lamSachTenFile('')).toBe('file');
    expect(lamSachTenFile('...')).toBe('file');
  });
});

describe('formatFileSize', () => {
  it('hiển thị đúng các mốc thường gặp', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1023)).toBe('1023 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024 * 5)).toBe('5 MB');
  });

  it('không hiện "undefined" khi vượt mốc GB', () => {
    // Trước đây mảng đơn vị chỉ tới GB, cỡ lớn hơn cho ra "1 undefined".
    expect(formatFileSize(1024 ** 4)).not.toContain('undefined');
    expect(formatFileSize(1024 ** 5)).not.toContain('undefined');
  });

  it('không vỡ với số âm hay giá trị không hợp lệ', () => {
    expect(formatFileSize(-100)).toBe('0 Bytes');
    expect(formatFileSize(NaN)).toBe('0 Bytes');
    expect(formatFileSize(Infinity)).toBe('0 Bytes');
  });
});

describe('validateFile', () => {
  it('từ chối file đúng chằn mức tối đa — khớp với storage.rules', () => {
    // storage.rules chặn bằng `size < 10MB`, nên đúng 10MB phải bị chặn ngay ở
    // client, không để người dùng chờ tải xong rồi mới nhận lỗi từ máy chủ.
    const dungMuoiMB = taoFile('a.png', 10 * 1024 * 1024, 'image/png');
    expect(validateFile(dungMuoiMB)).toContain('quá lớn');
  });

  it('chấp nhận file ngay dưới mức tối đa', () => {
    const vuaDu = taoFile('a.png', 10 * 1024 * 1024 - 1, 'image/png');
    expect(validateFile(vuaDu)).toBeNull();
  });

  it('từ chối định dạng không nằm trong danh sách', () => {
    const exe = taoFile('virus.exe', 1000, 'application/x-msdownload');
    expect(validateFile(exe)).toContain('không được hỗ trợ');
  });

  it('chấp nhận ảnh và PDF', () => {
    expect(validateFile(taoFile('a.jpg', 5000, 'image/jpeg'))).toBeNull();
    expect(validateFile(taoFile('a.pdf', 5000, 'application/pdf'))).toBeNull();
  });
});

describe('getFileType', () => {
  it('phân loại đúng', () => {
    expect(getFileType('image/png')).toBe('image');
    expect(getFileType('application/pdf')).toBe('pdf');
    expect(getFileType('application/msword')).toBe('document');
  });
});
