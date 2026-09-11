import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Khoá tài khoản dịch vụ nằm NGOÀI repo; đường dẫn lấy từ biến môi trường GSC_KEY_FILE.
  const keyFile = process.env.GSC_KEY_FILE;
  if (!keyFile || !fs.existsSync(keyFile)) {
    console.error('Thiếu biến môi trường GSC_KEY_FILE hoặc file không tồn tại.');
    console.error('PowerShell:  $env:GSC_KEY_FILE = "F:/AI/_keys/atld-connect-73f1c77fc24e.json"');
    process.exit(1);
  }
  const auth = new GoogleAuth({
    keyFile: keyFile,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });

  const client = await auth.getClient();
  const tokenRes = await client.getAccessToken();
  const token = tokenRes.token;

  // Read sitemap.xml
  const sitemapPath = path.resolve(__dirname, '../public/sitemap.xml');
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
  const matches = [...sitemapXml.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)];
  const urls = matches.map(m => m[1]);

  console.log(`Tìm thấy ${urls.length} URL trong sitemap.xml để yêu cầu Google bot thu thập...`);

  let successCount = 0;
  let failCount = 0;

  for (const url of urls) {
    try {
      const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: url,
          type: 'URL_UPDATED'
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ [${res.status}] Đã báo Google Index: ${url}`);
        successCount++;
      } else {
        console.warn(`⚠️ [${res.status}] Lỗi khi báo URL ${url}:`, data.error?.message || data);
        failCount++;
      }
    } catch (err) {
      console.error(`❌ Lỗi kết nối URL ${url}:`, err.message);
      failCount++;
    }
  }

  console.log(`\n🎉 Hoàn tất! Thành công: ${successCount}/${urls.length}, Thất bại: ${failCount}`);
}

main().catch(console.error);
