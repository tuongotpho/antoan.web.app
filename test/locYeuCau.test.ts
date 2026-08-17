import { describe, it, expect } from 'vitest';
import {
  tinhTongHocVien,
  lotQuaLocSoHocVien,
  khopTuKhoa,
  KHONG_GIOI_HAN_HOC_VIEN,
  khopTuKhoaBaiViet,
} from '../utils/locYeuCau';

describe('tinhTongHocVien', () => {
  it('cộng đúng nhiều nội dung huấn luyện', () => {
    expect(
      tinhTongHocVien({
        trainingDetails: [{ participants: 30 }, { participants: 12 }],
      })
    ).toBe(42);
  });

  it('không vỡ khi thiếu dữ liệu', () => {
    expect(tinhTongHocVien({})).toBe(0);
    expect(tinhTongHocVien(null)).toBe(0);
    expect(tinhTongHocVien({ trainingDetails: [{}, { participants: undefined }] })).toBe(0);
  });
});

describe('lotQuaLocSoHocVien — không được giấu khách hàng lớn', () => {
  const nhaMayLon = { trainingDetails: [{ participants: 1500 }] };

  it('yêu cầu 1500 học viên VẪN hiện khi chưa đặt bộ lọc', () => {
    // Đây chính là lỗi cũ: mức mặc định 1000 bị dùng làm trần cứng, nên các
    // nhà máy và tập đoàn — khách hàng đáng giá nhất — bị ẩn khỏi danh sách
    // mà không ai biết.
    expect(lotQuaLocSoHocVien(nhaMayLon, 0, KHONG_GIOI_HAN_HOC_VIEN)).toBe(true);
  });

  it('yêu cầu đúng 1000 học viên vẫn hiện', () => {
    expect(
      lotQuaLocSoHocVien({ trainingDetails: [{ participants: 1000 }] }, 0, KHONG_GIOI_HAN_HOC_VIEN)
    ).toBe(true);
  });

  it('vẫn lọc đúng khi người dùng THỰC SỰ đặt mức trần', () => {
    expect(lotQuaLocSoHocVien(nhaMayLon, 0, 500)).toBe(false);
    expect(lotQuaLocSoHocVien({ trainingDetails: [{ participants: 300 }] }, 0, 500)).toBe(true);
  });

  it('lọc đúng theo mức sàn', () => {
    const nho = { trainingDetails: [{ participants: 5 }] };
    expect(lotQuaLocSoHocVien(nho, 10, KHONG_GIOI_HAN_HOC_VIEN)).toBe(false);
    expect(lotQuaLocSoHocVien(nho, 5, KHONG_GIOI_HAN_HOC_VIEN)).toBe(true);
  });
});

describe('khopTuKhoa — không được vỡ vì thiếu trường', () => {
  it('không vỡ khi yêu cầu thiếu địa điểm hoặc mô tả', () => {
    // Lỗi cũ: gọi thẳng req.location.toLowerCase() nên một bản ghi thiếu
    // trường là cả danh sách vỡ ngay khi gõ tìm kiếm.
    expect(() => khopTuKhoa({}, 'điện')).not.toThrow();
    expect(() => khopTuKhoa({ trainingDetails: [{}] }, 'điện')).not.toThrow();
    expect(khopTuKhoa({}, 'điện')).toBe(false);
  });

  it('tìm theo địa điểm', () => {
    expect(khopTuKhoa({ location: 'KCN Quang Minh, Hà Nội' }, 'hà nội')).toBe(true);
  });

  it('tìm theo mô tả', () => {
    expect(khopTuKhoa({ description: 'Cần giảng viên có chứng chỉ' }, 'chứng chỉ')).toBe(true);
  });

  it('tìm theo loại hình huấn luyện', () => {
    expect(
      khopTuKhoa({ trainingDetails: [{ type: 'An toàn điện' }] }, 'an toàn điện')
    ).toBe(true);
  });

  it('từ khoá rỗng thì mọi yêu cầu đều lọt', () => {
    expect(khopTuKhoa({}, '')).toBe(true);
    expect(khopTuKhoa({}, '   ')).toBe(true);
  });

  it('không phân biệt hoa thường', () => {
    expect(khopTuKhoa({ location: 'Hà Nội' }, 'HÀ NỘI')).toBe(true);
  });
});

describe('khopTuKhoaBaiViet — trang blog không được vỡ vì thiếu trường', () => {
  it('không vỡ khi bài viết thiếu tiêu đề, tóm tắt hoặc thẻ', () => {
    expect(() => khopTuKhoaBaiViet({}, 'an toàn')).not.toThrow();
    expect(() => khopTuKhoaBaiViet({ tags: undefined }, 'an toàn')).not.toThrow();
    expect(() => khopTuKhoaBaiViet({ tags: [null as never] }, 'an toàn')).not.toThrow();
    expect(khopTuKhoaBaiViet({}, 'an toàn')).toBe(false);
  });

  it('tìm theo tiêu đề', () => {
    expect(khopTuKhoaBaiViet({ title: 'An toàn điện trong nhà máy' }, 'nhà máy')).toBe(true);
  });

  it('tìm theo tóm tắt', () => {
    expect(khopTuKhoaBaiViet({ excerpt: 'Hướng dẫn theo Nghị định 44' }, 'nghị định')).toBe(true);
  });

  it('tìm theo thẻ', () => {
    expect(khopTuKhoaBaiViet({ tags: ['pccc', 'an toàn lao động'] }, 'pccc')).toBe(true);
  });

  it('từ khoá rỗng thì mọi bài đều lọt', () => {
    expect(khopTuKhoaBaiViet({}, '')).toBe(true);
    expect(khopTuKhoaBaiViet({}, '   ')).toBe(true);
  });

  it('không phân biệt hoa thường', () => {
    expect(khopTuKhoaBaiViet({ title: 'An Toàn Điện' }, 'AN TOÀN')).toBe(true);
  });
});
