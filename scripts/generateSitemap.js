/**
 * Generate sitemap.xml for SEO
 * This script can be run manually or integrated into the build process
 *
 * Usage: node scripts/generateSitemap.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cấu hình Firebase — phải khớp với services/firebaseConfig.ts.
// Trước đây file này trỏ sang project khác và tên miền khác, nên sitemap sinh ra
// hoàn toàn không dùng được.
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyCFRcMNj_vOOqOaJlGbLbGF6Z1HpawGyDg',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'atld-connect.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'atld-connect',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'atld-connect.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '745800129021',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:745800129021:web:8b37c115c4327930dc6194',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Tên miền thật của trang. Trước đây ghi 'https://atld.web.app' — sai tên miền,
// nghĩa là mọi địa chỉ trong sitemap đều chỉ Google sang một trang khác.
const BASE_URL = 'https://antoan.web.app';

// Các trang tĩnh — phải khớp với router.tsx. Trước đây liệt kê /training,
// /about, /contact: cả ba đều KHÔNG tồn tại trong router, nên Google truy vào
// sẽ bị đá về trang chủ (Google gọi đây là "404 giả" và đánh giá thấp).
const staticPages = [
  { url: '/', changefreq: 'daily', priority: '1.0' },
  { url: '/blog', changefreq: 'daily', priority: '0.9' },
  { url: '/documents', changefreq: 'weekly', priority: '0.8' },
  // KHÔNG đưa /requests, /partners, /chat vào đây.
  //
  // Cả ba đều đang bị chặn trong public/robots.txt. Vừa bảo Google "đừng vào"
  // ở robots.txt vừa khai trong sitemap là tự mâu thuẫn — Google Search Console
  // báo lỗi "Indexed, though blocked by robots.txt". /requests trước đây nằm
  // trong danh sách này chính là trường hợp đó.
  //
  // Riêng /partners: nay firestore.rules ĐÃ cho khách chưa đăng nhập xem được
  // danh sách đối tác, nên về mặt kỹ thuật đưa vào sitemap là được. Nhưng
  // robots.txt vẫn chặn, và chặn có lý do: trang đó hiện số điện thoại cùng
  // email của các đơn vị đào tạo. Muốn Google index trang này thì phải bỏ dòng
  // Disallow trong robots.txt TRƯỚC, rồi mới thêm vào đây — đó là quyết định
  // kinh doanh, không phải quyết định kỹ thuật.
  // 8 trang giới thiệu lĩnh vực huấn luyện — khớp CoursesSection.tsx
  { url: '/training/an-toan-dien', changefreq: 'weekly', priority: '0.9' },
  { url: '/training/an-toan-xay-dung', changefreq: 'weekly', priority: '0.9' },
  { url: '/training/an-toan-hoa-chat', changefreq: 'weekly', priority: '0.9' },
  { url: '/training/pccc', changefreq: 'weekly', priority: '0.9' },
  { url: '/training/an-toan-buc-xa', changefreq: 'weekly', priority: '0.9' },
  { url: '/training/quan-trac-moi-truong', changefreq: 'weekly', priority: '0.9' },
  { url: '/training/danh-gia-phan-loai-lao-dong', changefreq: 'weekly', priority: '0.9' },
  { url: '/training/so-cap-cuu', changefreq: 'weekly', priority: '0.9' },
];

async function generateSitemap() {
  try {
    console.log('🚀 Starting sitemap generation...');

    // Fetch all published blog posts
    const blogQuery = query(collection(db, 'blogPosts'), where('published', '==', true));
    const blogSnapshot = await getDocs(blogQuery);

    console.log(`📝 Found ${blogSnapshot.size} published blog posts`);

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
      // nhiên. BlogDetailPage tra theo slug trước, không có mới tra theo id —
      // nên cả hai đều mở được, nhưng slug là địa chỉ nên đưa cho Google.
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

    // Write to public folder
    const publicPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    fs.writeFileSync(publicPath, xml, 'utf8');
    console.log(`✅ Sitemap generated successfully at: ${publicPath}`);

    // Also write to dist folder if it exists
    const distPath = path.join(__dirname, '..', 'dist', 'sitemap.xml');
    if (fs.existsSync(path.join(__dirname, '..', 'dist'))) {
      fs.writeFileSync(distPath, xml, 'utf8');
      console.log(`✅ Sitemap also copied to: ${distPath}`);
    }

    console.log(`\n📊 Sitemap statistics:`);
    console.log(`   - Static pages: ${staticPages.length}`);
    console.log(`   - Blog posts: ${blogSnapshot.size}`);
    console.log(`   - Total URLs: ${staticPages.length + blogSnapshot.size}`);
    console.log(`\n🔗 Sitemap URL: ${BASE_URL}/sitemap.xml`);

    process.exit(0);
  } catch (error) {
    // KHÔNG chặn build. Script này chạy nối sau `vite build`, nên nếu để nó
    // thoát với mã lỗi thì một trục trặc mạng hay quyền đọc cũng đủ làm CI đỏ
    // và chặn cả bản deploy — trong khi hậu quả thật chỉ là sitemap cũ đi một
    // nhịp (bản trong public/ vẫn được dùng).
    console.error('⚠️  Không sinh được sitemap:', error?.message || error);
    console.error('   Bản build vẫn tiếp tục, dùng public/sitemap.xml hiện có.');
    console.error('   Chạy lại riêng bằng: npm run sitemap');
    process.exit(0);
  }
}

generateSitemap();
