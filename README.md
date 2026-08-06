# 🦺 An Toàn Lao Động Platform

Nền tảng kết nối doanh nghiệp với đơn vị cung cấp dịch vụ đào tạo An toàn Lao động tại Việt Nam.

## 🌟 Tính năng chính

### 📋 Cho Doanh nghiệp

- Đăng yêu cầu đào tạo miễn phí
- Nhận báo giá từ nhiều đơn vị
- Chat trực tiếp với đơn vị đào tạo
- Theo dõi tiến độ yêu cầu

### 🎓 Cho Đơn vị Đào tạo

- Xem danh sách yêu cầu đào tạo
- Gửi báo giá cho khách hàng
- Chat với khách hàng tiềm năng
- Quản lý hồ sơ doanh nghiệp

### 📰 Blog & Tài liệu

- Blog về An toàn Lao động
- **🤖 AI Blog Writer** - Tạo bài viết tự động với Gemini AI
- Thư viện tài liệu pháp lý
- Hướng dẫn và Case studies

### 👨‍💼 Admin Panel

- Quản lý yêu cầu đào tạo
- Phê duyệt đối tác
- **Viết blog tự động với AI**
- Quản lý tài liệu
- Thống kê KPI

## 🤖 AI Blog Writer (NEW!)

Tạo bài blog chuyên nghiệp tự động bằng Gemini AI:

### Setup trong 2 phút:

1. Lấy API key: https://aistudio.google.com/app/apikey
2. Admin → Quản lý Blog → "Viết bằng AI"
3. Paste API key → Lưu
4. Done!

### Sử dụng:

```
Nhập chủ đề → AI tạo bài viết hoàn chỉnh trong 15s
→ Title + Excerpt + Content (800-1200 từ) + Tags
→ Upload ảnh → Publish!
```

📖 **[Chi tiết AI Blog Writer →](./AI_BLOG_SETUP.md)**

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Firebase (Firestore, Storage, Functions)
- **Auth**: Firebase Authentication
- **AI**: Google Gemini 1.5 Flash
- **Styling**: Tailwind CSS
- **Icons**: Font Awesome
- **Deployment**: Firebase Hosting, tự động qua GitHub Actions

## 📦 Cài đặt

Yêu cầu **Node.js 20** trở lên.

```bash
git clone https://github.com/tuongotpho/antoan.web.app.git
cd antoan.web.app
npm install
cp .env.example .env    # điền cấu hình Firebase phía client
npm run dev
```

## 🔧 Lệnh thường dùng

```bash
npm run dev        # chạy máy chủ phát triển (cổng 3000)
npm run build      # build ra thư mục dist
npm run preview    # xem thử bản build
npm run lint       # kiểm tra mã nguồn
npm test           # chạy test
```

## 🚀 Deploy

### Hosting — tự động

Push vào nhánh `main` là GitHub Actions tự build và deploy lên
**antoan.web.app**. Xem tiến trình ở tab **Actions**.

Workflow: [`.github/workflows/deploy-hosting.yml`](.github/workflows/deploy-hosting.yml).
Nó chỉ deploy hosting target `main` (site `antoan`) — site `atld-connect`
không bị ảnh hưởng.

Cần một secret trong GitHub → Settings → Secrets → Actions:

| Secret | Lấy ở đâu |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Chạy `firebase init hosting:github`, hoặc Firebase Console → Project settings → Service accounts → Generate new private key (dán toàn bộ JSON) |

### Functions, Rules, Storage — chạy tay

Workflow **không** deploy các phần này. Sau khi sửa `firestore.rules`,
`storage.rules` hoặc thư mục `functions/`, chạy:

```bash
firebase deploy --only functions,firestore:rules,storage
```

## 🏷️ Ký hiệu phiên bản

Mỗi bản build được gắn số theo **ngày phát hành**, dạng ngày+tháng+năm rút gọn
— ví dụ 6/8/2026 là `ver.6826`. Số này sinh tự động trong
[`vite.config.ts`](vite.config.ts), **không cần sửa tay**, và luôn tính theo giờ
Việt Nam (máy chạy CI dùng giờ UTC nên bản deploy lúc rạng sáng sẽ bị lệch ngày
nếu không quy đổi).

Xem phiên bản đang chạy ở hai chỗ:

- **Cuối trang web** — cạnh dòng bản quyền
- **Console trình duyệt** (F12 → Console)

Hữu ích khi có sự cố: chỉ cần hỏi "cuối trang ghi ver mấy?" là biết máy đó đang
chạy bản nào, hay đang kẹt bản cũ trong cache.

## 🔐 Quản lý bí mật

Không đặt khoá bí mật vào mã nguồn hay tài liệu — repo này công khai.

| Bí mật | Nơi lưu đúng |
|---|---|
| Token Telegram bot | `firebase functions:config:set telegram.bot_token="..." telegram.chat_id="..."` |
| `GEMINI_API_KEY` | Secret của Cloud Functions (`functions.runWith({ secrets: [...] })`) — **không** đưa vào bundle client |
| Cấu hình Firebase phía client | `.env` (đã có trong `.gitignore`); các khoá `VITE_FIREBASE_*` này công khai theo thiết kế, không phải bí mật |

Việc gửi email đi qua callable function `sendAppEmail` (có kiểm tra đăng nhập).
Client **không** ghi thẳng vào collection `mail` — rules đã khoá, vì mở ra đồng
nghĩa ai cũng gửi được email mang tên miền này.

## 🌐 Bản đang chạy

🔗 **https://antoan.web.app**

## 📄 License

Private project - All rights reserved

---

Built with ❤️ for Occupational Safety in Vietnam
