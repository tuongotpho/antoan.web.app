import React from 'react';
import HeroSection from '../components/home/HeroSection';
import StatsSection from '../components/home/StatsSection';
import ProcessSection from '../components/home/ProcessSection';
import BenefitsSection from '../components/home/BenefitsSection';
import CoursesSection from '../components/home/CoursesSection';
import TrustedPartnersSection from '../components/home/TrustedPartnersSection';
import CTAFormSection from '../components/home/CTAFormSection';
import FAQSection, { HOME_FAQS } from '../components/home/FAQSection';
import SEOHead from '../components/SEOHead';

const HomePage: React.FC = () => {
  const homeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://antoan.web.app/#website',
        'url': 'https://antoan.web.app/',
        'name': 'SafetyConnect',
        'description': 'Nền tảng kết nối doanh nghiệp với các đơn vị huấn luyện an toàn lao động trực tuyến (online) và trực tiếp uy tín trên toàn quốc.',
        'inLanguage': 'vi-VN',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://antoan.web.app/blog?search={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'EducationalOrganization',
        '@id': 'https://antoan.web.app/#organization',
        'name': 'SafetyConnect',
        'url': 'https://antoan.web.app/',
        'logo': 'https://raw.githubusercontent.com/thanhlv87/pic/refs/heads/main/connected.png',
        'image': 'https://raw.githubusercontent.com/thanhlv87/pic/refs/heads/main/connected.png',
        'description': 'Nền tảng kết nối doanh nghiệp với các đối tác đào tạo, huấn luyện an toàn vệ sinh lao động trực tuyến (online) và trực tiếp uy tín trên toàn quốc.',
        'address': {
          '@type': 'PostalAddress',
          'addressCountry': 'VN'
        },
        'sameAs': [
          'https://facebook.com',
          'https://zalo.me'
        ],
        'offers': {
          '@type': 'Offer',
          'category': 'Education',
          'price': '0',
          'priceCurrency': 'VND',
          'description': 'Đăng yêu cầu nhận báo giá huấn luyện an toàn lao động miễn phí từ các trung tâm đào tạo đủ điều kiện theo Nghị định 44/2016/NĐ-CP & 62/2025/NĐ-CP.'
        }
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://antoan.web.app/#faq',
        'mainEntity': HOME_FAQS.map(faq => ({
          '@type': 'Question',
          'name': faq.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.answer
          }
        }))
      }
    ]
  };

  return (
    <>
      <SEOHead
        title="SafetyConnect - Nền Tảng Huấn Luyện An Toàn Lao Động Trực Tuyến & Online"
        description="Nền tảng kết nối doanh nghiệp với các đối tác huấn luyện an toàn lao động trực tuyến (online) và trực tiếp uy tín, chuyên nghiệp. Hỗ trợ đăng yêu cầu báo giá nhanh chóng."
        url="https://antoan.web.app/"
        keywords={[
          'huấn luyện an toàn lao động trực tuyến',
          'huấn luyện an toàn lao động online',
          'học an toàn lao động trực tuyến',
          'đào tạo an toàn lao động online',
          'chứng chỉ an toàn lao động',
          'an toàn vệ sinh lao động',
          'nghị định 44',
          'nghị định 62',
          'SafetyConnect'
        ]}
        schema={homeSchema}
      />
      <HeroSection />
      <StatsSection />
      <ProcessSection />
      <BenefitsSection />
      <CoursesSection />
      <TrustedPartnersSection />
      <FAQSection />
      <CTAFormSection />
    </>
  );
};

export default HomePage;
