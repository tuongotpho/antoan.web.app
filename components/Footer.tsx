import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-dark text-white py-8 mt-12 border-t border-gray-800">
      <div className="container mx-auto text-center px-4 space-y-2">
        <p className="text-lg font-bold text-white">SafetyConnect</p>
        <p className="text-sm text-gray-400">Nền tảng kết nối Huấn luyện An toàn Lao động trực tuyến & trực tiếp</p>
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-gray-300 pt-2">
          <a href="tel:0982722036" className="hover:text-primary transition-colors flex items-center">
            <i className="fas fa-phone-alt mr-2 text-gray-400"></i> Hotline: 0982.722.036
          </a>
          <span className="hidden md:inline text-gray-600">|</span>
          <a href="https://zalo.me/0982722036" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center">
            <span className="inline-block bg-[#0068FF] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm mr-2">Zalo</span>
            Liên hệ Zalo: 0982.722.036
          </a>
        </div>
        <p className="text-xs text-gray-500 pt-4">
          &copy; {new Date().getFullYear()} SafetyConnect. All Rights Reserved.
          {/* Ký hiệu phiên bản do vite.config.ts sinh theo ngày phát hành.
              Hiện ở đây để khi có sự cố chỉ cần hỏi "cuối trang ghi ver mấy?"
              là biết máy đó đang chạy bản nào hay đang kẹt cache bản cũ. */}
          <span className="mx-1 text-gray-600">·</span>
          <span title="Phiên bản phát hành">ver.{__APP_VERSION__}</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
