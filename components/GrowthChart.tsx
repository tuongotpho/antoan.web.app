import React from 'react';
import { gomTheoThang, mucCaoNhat } from '../utils/thongKeThang';

interface CoNgayTao {
  createdAt?: { toDate?: () => Date; seconds?: number } | Date | null;
}

interface GrowthChartProps {
  title: string;
  /** Danh sách yêu cầu huấn luyện, lấy từ Firestore */
  requests: CoNgayTao[];
  /** Danh sách đối tác, lấy từ Firestore */
  partners: CoNgayTao[];
  /** Số tháng hiển thị, tính cả tháng hiện tại */
  soThang?: number;
}

/**
 * Biểu đồ tăng trưởng theo tháng.
 *
 * TRƯỚC ĐÂY component này KHÔNG nhận dữ liệu nào cả — chỉ nhận mỗi tiêu đề —
 * và vẽ sáu cột có chiều cao ghi cứng trong mã: 40%, 60%, 50%, 75%, 65%, 85%.
 * Kèm chú thích "Yêu cầu" và "Đối tác" như thể đó là số thật.
 *
 * Nhìn vào thấy một đường tăng trưởng đẹp đều, trong khi nó không đọc lấy một
 * bản ghi nào. Nguy hơn nữa: biểu đồ nằm ở trang quản trị — chỗ dùng để nhìn
 * tình hình mà ra quyết định.
 *
 * Nay vẽ từ dữ liệu thật, và nếu chưa có bản ghi nào thì nói thẳng là chưa có,
 * thay vì vẽ cột cho đẹp.
 */
const GrowthChart: React.FC<GrowthChartProps> = ({
  title,
  requests,
  partners,
  soThang = 6,
}) => {
  const cot = gomTheoThang(requests, partners, soThang);
  const dinh = mucCaoNhat(cot);
  const tongCong = cot.reduce((s, c) => s + c.soYeuCau + c.soDoiTac, 0);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md h-full">
      <h3 className="text-lg font-bold text-neutral-dark mb-4">{title}</h3>

      {tongCong === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4 text-center">
          <i className="fas fa-chart-column text-3xl text-gray-300 mb-3"></i>
          <p className="text-gray-500 text-sm">
            Chưa có yêu cầu hay đối tác nào trong {soThang} tháng gần đây.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Biểu đồ sẽ hiện khi có dữ liệu thật.
          </p>
        </div>
      ) : (
        <div
          className="h-56 flex items-end justify-around bg-gray-50 rounded-lg p-4 gap-2"
          role="img"
          aria-label={`Biểu đồ ${soThang} tháng gần đây. ${cot
            .map((c) => `${c.nhan}: ${c.soYeuCau} yêu cầu, ${c.soDoiTac} đối tác`)
            .join('. ')}`}
        >
          {cot.map((c) => (
            <div key={`${c.nam}-${c.thang}`} className="flex-1 flex flex-col items-center h-full">
              <div className="flex-1 w-full flex items-end justify-center gap-1">
                {/* Chiều cao tính theo tỉ lệ với mốc cao nhất. Cột có số 0 vẫn
                    chừa một vạch mỏng để nhìn ra là tháng đó trống. */}
                <div
                  className="w-1/2 bg-primary/40 rounded-t transition-all"
                  style={{ height: `${Math.max(2, (c.soYeuCau / dinh) * 100)}%` }}
                  title={`${c.nhan}: ${c.soYeuCau} yêu cầu`}
                ></div>
                <div
                  className="w-1/2 bg-blue-300 rounded-t transition-all"
                  style={{ height: `${Math.max(2, (c.soDoiTac / dinh) * 100)}%` }}
                  title={`${c.nhan}: ${c.soDoiTac} đối tác`}
                ></div>
              </div>
              <span className="text-xs text-gray-500 mt-2">{c.nhan}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center space-x-6 mt-4 text-sm text-gray-500">
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-primary/40 mr-2"></span>
          <span>Yêu cầu</span>
        </div>
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-blue-300 mr-2"></span>
          <span>Đối tác</span>
        </div>
      </div>
    </div>
  );
};

export default GrowthChart;
