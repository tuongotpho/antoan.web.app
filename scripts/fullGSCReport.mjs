import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
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
    scopes: [
      'https://www.googleapis.com/auth/webmasters',
      'https://www.googleapis.com/auth/webmasters.readonly',
    ],
  });

  const client = await auth.getClient();
  const tokenRes = await client.getAccessToken();
  const token = tokenRes.token;

  const siteUrl = 'https://antoan.web.app/';
  console.log(`=== BÁO CÁO KẾT NỐI VÀ TÌNH TRẠNG GOOGLE SEARCH CONSOLE CHO ${siteUrl} ===\n`);

  // 1. Submit / Check Sitemap
  console.log('--- 1. TÌNH TRẠNG SITEMAP ---');
  let sitemapsRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  let sitemapsData = await sitemapsRes.json();
  console.log('Danh sách sitemap hiện tại:', JSON.stringify(sitemapsData, null, 2));

  // If no sitemaps submitted, submit sitemap.xml
  const sitemapUrl = 'https://antoan.web.app/sitemap.xml';
  if (!sitemapsData.sitemap || sitemapsData.sitemap.length === 0) {
    console.log(`\nĐang gửi sitemap ${sitemapUrl} lên Google Search Console...`);
    const submitRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Kết quả gửi sitemap:', submitRes.status, submitRes.statusText);

    // Re-check
    sitemapsRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    sitemapsData = await sitemapsRes.json();
    console.log('Sitemap sau khi gửi:', JSON.stringify(sitemapsData, null, 2));
  }

  // 2. Search Performance (Analytics - 16 months back)
  console.log('\n--- 2. HIỆU SUẤT TÌM KIẾM (SEARCH PERFORMANCE - 16 THÁNG QUA) ---');
  const now = new Date();
  const end = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const start = new Date(now.getTime() - 480 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const analyticsRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      startDate: start,
      endDate: end,
      dimensions: ['query'],
      rowLimit: 25
    })
  });
  const analyticsData = await analyticsRes.json();
  console.log('Từ khóa tìm kiếm (Top Queries):', JSON.stringify(analyticsData, null, 2));

  const pagesRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      startDate: start,
      endDate: end,
      dimensions: ['page'],
      rowLimit: 25
    })
  });
  const pagesData = await pagesRes.json();
  console.log('Trang có lượt hiển thị / click (Top Pages):', JSON.stringify(pagesData, null, 2));

  // Overall totals
  const totalRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      startDate: start,
      endDate: end
    })
  });
  const totalData = await totalRes.json();
  console.log('Tổng quan toàn bộ số liệu (Clicks, Impressions, CTR, Avg Position):', JSON.stringify(totalData, null, 2));

  // 3. Inspect Specific Key URLs
  console.log('\n--- 3. KIỂM TRA TRẠNG THÁI LẬP CHỈ MỤC TỪNG URL (URL INSPECTION) ---');
  const urlsToCheck = [
    'https://antoan.web.app/',
    'https://antoan.web.app/blog',
    'https://antoan.web.app/documents',
    'https://antoan.web.app/training/an-toan-dien',
    'https://antoan.web.app/training/an-toan-xay-dung',
    'https://antoan.web.app/training/pccc',
    'https://antoan.web.app/blog/huan-luyen-an-toan-lao-dong-cho-cong-ty-quan-ly-chung-cu-khu-do-thi-chia-khoa-bao-ve-nguoi-lao-dong-va-cu-dan',
    'https://antoan.web.app/blog/an-toan-lao-dong-cho-nhan-vien-vien-thong-quy-dinh-tu-a-z'
  ];

  const inspectionReports = [];

  for (const url of urlsToCheck) {
    try {
      const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inspectionUrl: url,
          siteUrl: siteUrl
        })
      });
      const data = await res.json();
      const idx = data.inspectionResult?.indexStatusResult || {};
      inspectionReports.push({
        url,
        verdict: idx.verdict || 'UNKNOWN',
        coverageState: idx.coverageState || 'N/A',
        robotsTxtState: idx.robotsTxtState || 'N/A',
        indexingState: idx.indexingState || 'N/A',
        lastCrawlTime: idx.lastCrawlTime || 'Chưa crawl',
        pageFetchState: idx.pageFetchState || 'N/A',
        googleCanonical: idx.googleCanonical || 'N/A',
        userCanonical: idx.userCanonical || 'N/A',
        raw: data.inspectionResult
      });
    } catch (err) {
      inspectionReports.push({
        url,
        error: err.message
      });
    }
  }

  console.log('\n=== TỔNG HỢP KIỂM TRA LẬP CHỈ MỤC URL ===');
  console.table(inspectionReports.map(r => ({
    URL: r.url.replace('https://antoan.web.app', ''),
    Verdict: r.verdict,
    Coverage: r.coverageState,
    Robots: r.robotsTxtState,
    CrawlTime: r.lastCrawlTime
  })));

  console.log('\nChi tiết từng URL:');
  console.log(JSON.stringify(inspectionReports, null, 2));
}

main().catch(console.error);
