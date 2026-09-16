import React from 'react';

interface ChamSaoProps {
  /** Điểm hiện tại 1..5, hoặc 0/undefined khi chưa chấm */
  giaTri?: number;
  onChange: (diem: number) => void;
  /** Tên tiêu chí, đọc cho trình đọc màn hình và làm nhãn nhóm nút */
  ten: string;
}

const NHAN_DIEM = ['Rất kém', 'Kém', 'Bình thường', 'Tốt', 'Rất tốt'];

/**
 * Năm nút sao để chấm điểm. Dùng nút thật (không phải icon bắt click) để
 * bấm được bằng bàn phím và trình đọc màn hình đọc thành "Tốt, 4 trên 5".
 * Kích thước 44px — vừa ngón tay, vì học viên chủ yếu điền trên điện thoại.
 */
const ChamSao: React.FC<ChamSaoProps> = ({ giaTri = 0, onChange, ten }) => (
  <div className="flex items-center gap-1" role="radiogroup" aria-label={ten}>
    {[1, 2, 3, 4, 5].map((diem) => {
      const daChon = diem <= giaTri;
      return (
        <button
          key={diem}
          type="button"
          role="radio"
          aria-checked={giaTri === diem}
          aria-label={`${NHAN_DIEM[diem - 1]}, ${diem} trên 5`}
          onClick={() => onChange(diem)}
          className={`w-11 h-11 rounded-full flex items-center justify-center text-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
            daChon ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'
          }`}
        >
          <i className={daChon ? 'fas fa-star' : 'far fa-star'} aria-hidden="true"></i>
        </button>
      );
    })}
    <span className="ml-2 text-sm text-gray-600 min-w-[5.5rem]" aria-live="polite">
      {giaTri ? NHAN_DIEM[giaTri - 1] : ''}
    </span>
  </div>
);

export default ChamSao;
