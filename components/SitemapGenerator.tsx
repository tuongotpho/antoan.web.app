import React, { useState } from 'react';
import { db, collection, query, where, getDocs } from '../services/firebaseConfig';

const SitemapGenerator: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; url?: string } | null>(
    null
  );

  // Tên miền thật của trang.
  //
  // TRƯỚC ĐÂY ghi 'https://atld.web.app' — sai tên miền, nên sitemap tạo ra từ
  // trang quản trị chỉ đường cho Google sang một website khác. Bản trong
  // scripts/generateSitemap.js đã được sửa từ trước, nhưng bản ở đây thì chưa
  // ai sờ tới: cùng một lỗi, hai chỗ, vá một nơi là sót nơi kia.
  const BASE_URL = 'https://antoan.web.app';

  // Danh sách phải khớp với router.tsx.
  //
  // TRƯỚC ĐÂY có /training, /about và /contact — cả ba đều KHÔNG tồn tại trong
  // router. Google truy vào sẽ bị đá về trang chủ, và coi đó là "404 giả".
  //
  // KHÔNG đưa /partners vào: firestore.rules yêu cầu đăng nhập mới xem được
  // danh sách đối tác, nên Googlebot chỉ thấy màn hình mời đăng nhập.
  const staticPages = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/blog', changefreq: 'daily', priority: '0.9' },
    { url: '/requests', changefreq: 'daily', priority: '0.8' },
    { url: '/documents', changefreq: 'weekly', priority: '0.8' },
    { url: '/training/an-toan-dien', changefreq: 'weekly', priority: '0.9' },
    { url: '/training/an-toan-xay-dung', changefreq: 'weekly', priority: '0.9' },
    { url: '/training/an-toan-hoa-chat', changefreq: 'weekly', priority: '0.9' },
    { url: '/training/pccc', changefreq: 'weekly', priority: '0.9' },
    { url: '/training/an-toan-buc-xa', changefreq: 'weekly', priority: '0.9' },
    { url: '/training/quan-trac-moi-truong', changefreq: 'weekly', priority: '0.9' },
    { url: '/training/danh-gia-phan-loai-lao-dong', changefreq: 'weekly', priority: '0.9' },
    { url: '/training/so-cap-cuu', changefreq: 'weekly', priority: '0.9' },
  ];

  const generateSitemap = async () => {
    setGenerating(true);
    setResult(null);

    try {
      // Fetch all published blog posts
      const blogQuery = query(collection(db, 'blogPosts'), where('published', '==', true));
      const blogSnapshot = await getDocs(blogQuery);

      // Start XML
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // Add static pages
      staticPages.forEach((page) => {
        xml += '  <url>\n';
        xml += `    <loc>${BASE_URL}${page.url}</loc>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
        xml += '  </url>\n';
      });

      // Add blog posts
      blogSnapshot.forEach((doc) => {
        const post = doc.data();
        const lastmod =
          post.updatedAt?.toDate() ||
          post.publishedAt?.toDate() ||
          post.createdAt?.toDate() ||
          new Date();

        // Ưu tiên slug: địa chỉ có chữ dễ đọc tốt cho SEO hơn chuỗi id ngẫu
        // nhiên. Trang chi tiết bài viết tra theo slug trước, không có mới tra
        // theo id — nên cả hai đều mở được.
        const duongDan = post.slug || doc.id;

        xml += '  <url>\n';
        xml += `    <loc>${BASE_URL}/blog/${duongDan}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `    <lastmod>${lastmod.toISOString().split('T')[0]}</lastmod>\n`;
        xml += '  </url>\n';
      });

      // Close XML
      xml += '</urlset>';

      // Download as file
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sitemap.xml';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setResult({
        success: true,
        message: `Sitemap generated successfully! ${staticPages.length} static pages + ${blogSnapshot.size} blog posts = ${staticPages.length + blogSnapshot.size} total URLs.`,
        url: `${BASE_URL}/sitemap.xml`,
      });
    } catch (error: any) {
      console.error('Error generating sitemap:', error);
      setResult({
        success: false,
        message: `Error: ${error.message}`,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
          <i className="fas fa-sitemap text-white text-xl"></i>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Sitemap Generator</h3>
          <p className="text-sm text-gray-600">Generate sitemap.xml for SEO</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex gap-3">
          <i className="fas fa-info-circle text-blue-500 mt-1"></i>
          <div className="text-sm text-gray-700 space-y-1">
            <p className="font-semibold">What is sitemap.xml?</p>
            <p>
              Sitemap helps search engines like Google discover and index all pages on your website,
              improving SEO rankings.
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs mt-2">
              <li>Static pages (Home, Blog, Training, etc.)</li>
              <li>All published blog posts with updated dates</li>
              <li>Priority and change frequency for each URL</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        onClick={generateSitemap}
        disabled={generating}
        className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <i className="fas fa-spinner fa-spin"></i>
            <span>Generating sitemap...</span>
          </>
        ) : (
          <>
            <i className="fas fa-download"></i>
            <span>Generate & Download Sitemap</span>
          </>
        )}
      </button>

      {result && (
        <div
          className={`mt-4 p-4 rounded-lg border ${
            result.success
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-start gap-2">
            <i
              className={`fas ${result.success ? 'fa-check-circle' : 'fa-exclamation-circle'} mt-1`}
            ></i>
            <div className="flex-1">
              <p className="text-sm">{result.message}</p>
              {result.success && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold">Next steps:</p>
                  <ol className="text-xs list-decimal list-inside space-y-1">
                    <li>Upload the downloaded sitemap.xml to your /public folder</li>
                    <li>Deploy your website</li>
                    <li>Submit {result.url} to Google Search Console</li>
                    <li>Submit to Bing Webmaster Tools</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2 text-sm">Submit to Search Engines:</h4>
        <div className="space-y-2 text-xs">
          <div>
            <strong>Google Search Console:</strong>
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              https://search.google.com/search-console
            </a>
          </div>
          <div>
            <strong>Bing Webmaster Tools:</strong>
            <a
              href="https://www.bing.com/webmasters"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              https://www.bing.com/webmasters
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SitemapGenerator;
