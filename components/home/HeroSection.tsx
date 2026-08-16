import React from 'react';
import { cuonToiId } from '../../utils/cuonTrang';
import { useNavigate } from 'react-router-dom';

const HeroSection: React.FC = () => {
    const navigate = useNavigate();

    const scrollToForm = () => {
        cuonToiId('create-request-form');
    };

    return (
        <section className="relative bg-gradient-to-br from-primary via-orange-500 to-orange-600 text-white overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
                    <div className="absolute top-10 left-10 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
                    <div className="absolute top-20 right-20 w-3 h-3 bg-white/40 rounded-full animate-ping delay-500"></div>
                    <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-white/30 rounded-full animate-ping delay-1000"></div>
                </div>
            </div>

            <div className="relative container mx-auto px-4 py-24 md:py-40 text-center">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
                    <i className="fas fa-shield-alt text-white"></i>
                    <span className="text-sm font-semibold text-white">
                        Nền tảng kết nối huấn luyện an toàn lao động trực tuyến & trực tiếp chuyên nghiệp
                    </span>
                </div>

                <h1 className="text-4xl md:text-7xl font-extrabold mb-6 leading-tight animate-fade-in-up">
                    Huấn luyện & Đào tạo
                    <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-yellow-200 to-white">
                        An toàn Lao động Trực tuyến
                    </span>
                </h1>

                <p className="text-lg md:text-2xl max-w-3xl mx-auto mb-10 text-white/95 leading-relaxed animate-fade-in-up delay-200">
                    Kết nối doanh nghiệp với các đối tác huấn luyện an toàn lao động trực tuyến (online) và trực tiếp uy tín trên toàn quốc.
                </p>

                <div className="flex flex-wrap justify-center items-center gap-4 animate-fade-in-up delay-300">
                    <button
                        onClick={scrollToForm}
                        className="group bg-white text-primary font-bold py-4 px-10 rounded-xl shadow-2xl hover:shadow-white/30 hover:scale-105 transition-all duration-300 flex items-center gap-2"
                    >
                        <i className="fas fa-paper-plane group-hover:translate-x-1 transition-transform"></i>
                        Tạo Yêu Cầu Miễn Phí
                    </button>
                    <button
                        onClick={() => navigate('/requests')}
                        className="group border-2 border-white/50 backdrop-blur-sm bg-white/10 text-white font-bold py-4 px-10 rounded-xl hover:bg-white hover:text-primary hover:scale-105 transition-all duration-300 flex items-center gap-2"
                    >
                        <i className="fas fa-list-ul group-hover:scale-110 transition-transform"></i>
                        Xem Các Yêu Cầu
                    </button>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                    <i className="fas fa-chevron-down text-white/60 text-2xl"></i>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
