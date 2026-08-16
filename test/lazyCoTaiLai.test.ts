import { describe, it, expect } from 'vitest';
import { _noiBo } from '../utils/lazyCoTaiLai';

const { laLoiThieuManhMa } = _noiBo;

/**
 * Nhận diện lỗi "mảnh mã không còn tồn tại sau khi deploy bản mới".
 *
 * Nhận sai thành true với lỗi khác thì trang tự tải lại vô cớ.
 * Nhận sai thành false thì người dùng kẹt ở màn hình trắng cho tới khi tự
 * bấm tải lại — mà phần lớn sẽ bỏ đi chứ không bấm.
 */
describe('laLoiThieuManhMa — nhận đúng lỗi thiếu mảnh mã', () => {
  it('nhận ra thông báo của Chrome — đúng lỗi đã gặp thật', () => {
    const loi = new TypeError(
      'Failed to fetch dynamically imported module: https://antoan.web.app/assets/HomePage-Cno4AOVi.js'
    );
    expect(laLoiThieuManhMa(loi)).toBe(true);
  });

  it('nhận ra thông báo của Safari', () => {
    expect(
      laLoiThieuManhMa(new TypeError('Importing a module script failed.'))
    ).toBe(true);
  });

  it('nhận ra thông báo của Firefox', () => {
    expect(
      laLoiThieuManhMa(new TypeError('error loading dynamically imported module'))
    ).toBe(true);
  });

  it('nhận ra lỗi nạp mảnh mã kiểu cũ', () => {
    const loi = new Error('Loading chunk 5 failed');
    loi.name = 'ChunkLoadError';
    expect(laLoiThieuManhMa(loi)).toBe(true);
  });

  it('nhận ra lỗi khi trình duyệt không tải trước được mảnh mã', () => {
    expect(laLoiThieuManhMa(new Error('Unable to preload CSS for /assets/x.css'))).toBe(true);
  });
});

describe('laLoiThieuManhMa — KHÔNG nhận nhầm lỗi khác', () => {
  it('không nhận nhầm lỗi phân quyền Firestore', () => {
    const loi = new Error('Missing or insufficient permissions.');
    expect(laLoiThieuManhMa(loi)).toBe(false);
  });

  it('không nhận nhầm lỗi mất mạng', () => {
    expect(laLoiThieuManhMa(new TypeError('Failed to fetch'))).toBe(false);
  });

  it('không nhận nhầm lỗi lập trình thông thường', () => {
    expect(laLoiThieuManhMa(new TypeError("Cannot read properties of undefined"))).toBe(false);
    expect(laLoiThieuManhMa(new ReferenceError('x is not defined'))).toBe(false);
  });

  it('không vỡ với giá trị lạ', () => {
    expect(laLoiThieuManhMa(null)).toBe(false);
    expect(laLoiThieuManhMa(undefined)).toBe(false);
    expect(laLoiThieuManhMa('chuỗi bất kỳ')).toBe(false);
    expect(laLoiThieuManhMa(123)).toBe(false);
  });
});
