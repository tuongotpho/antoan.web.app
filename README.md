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

## 🚀 Deploy — tự động toàn bộ

**Push lên nhánh `main` là xong.** GitHub Actions sẽ kiểm tra rồi deploy tất cả:
hosting, `firestore.rules`, `storage.rules` và `functions/`. Xem tiến trình ở
tab **Actions**.

Workflow: [`.github/workflows/deploy-hosting.yml`](.github/workflows/deploy-hosting.yml)

Không còn bước chạy tay nào. Trước đây rules và functions phải tự deploy, và vì
lệnh chạy tay không ghi rõ project nên đã có lần nạp rules vào project khác với
project app đang chạy — rules sửa xong mà không bao giờ có hiệu lực.

### Workflow chạy gì

**Cửa kiểm tra** (hỏng ở đây thì không deploy):

1. `npm run lint`
2. `npx vitest run` (trừ test rules)
3. `npm run test:rules` — kiểm `firestore.rules` trên Firestore emulator

Bước 3 quan trọng vì rules nay được deploy tự động: một dòng rules sai có thể
khoá sạch cả app, nên phải chặn từ trước.

**Deploy** (chỉ chạy khi cửa kiểm tra đã qua):

4. Build, gắn ký hiệu phiên bản theo ngày
5. **Kiểm bản build có nối đúng project không** — nếu secret `VITE_FIREBASE_*`
   trỏ nhầm nơi, workflow dừng ngay thay vì deploy một bản nối sai project
6. Deploy `hosting:main`, `firestore:rules`, `storage`, `functions` trong một
   lệnh, có ghi rõ `--project`

### Đổi project Firebase

Sửa ở **ba chỗ**, phải khớp nhau:

| Chỗ | Vai trò |
|---|---|
| `PROJECT_ID` trong workflow | Nơi deploy tới |
| `services/firebaseConfig.ts` | Nơi app kết nối tới (giá trị dự phòng) |
| Secrets `VITE_FIREBASE_*` trên GitHub | Ghi đè giá trị dự phòng lúc build — **để trống thì dùng giá trị dự phòng** |

Lệch nhau là app nối một nơi còn rules nạp một nơi khác.

### Secret cần có

| Secret | Lấy ở đâu | Bắt buộc |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Console → Project settings → Service accounts → Generate new private key (dán toàn bộ JSON) | **Có** |
| `VITE_FIREBASE_*` | Firebase Console → Project settings → General → Your apps | Không — bỏ trống thì dùng giá trị dự phòng trong mã |

⚠️ **Quyền của khoá service account — kiểm trước lần push đầu tiên.**

Khoá tạo bằng `firebase init hosting:github` chỉ được cấp quyền **hosting**.
Từ nay workflow còn deploy rules và functions, nên nếu chưa cấp thêm quyền,
lượt chạy sẽ đỏ ở bước deploy với lỗi kiểu `PERMISSION_DENIED` hoặc
`Missing permissions`.

Cấp thêm tại Google Cloud Console → IAM & Admin → IAM → tìm service account
đang dùng → Edit → Add another role:

| Vai trò | Để deploy |
|---|---|
| Firebase Hosting Admin | hosting |
| Firebase Rules Admin | `firestore.rules`, `storage.rules` |
| **Firebase Storage Admin** | đọc bucket mặc định khi deploy `storage` |
| Cloud Functions Admin | `functions/` |
| Service Account User | bắt buộc kèm theo khi deploy functions |
| Cloud Build Editor + Artifact Registry Writer | quá trình đóng gói functions |

⚠️ **Firebase Storage Admin** khác với **Storage Admin**. Cái sau là của Cloud
Storage và *không* đủ — thiếu đúng quyền `firebasestorage.defaultBucket.get`,
lỗi hay gặp nhất khi dựng workflow này lần đầu.

Đây là loại việc bấm tay 5 phút trên Console nhưng chặn toàn bộ đường deploy —
nếu Actions báo đỏ ngay lần đầu, gần như chắc chắn là do đây.

### Chạy tay khi cần

```bash
npm run test:rules   # kiểm rules trên emulator, không đụng máy chủ
firebase deploy --only functions,firestore:rules,storage --project atld-connect
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

| Bí mật | Nơi lưu đúng | Có phải bí mật thật không |
|---|---|---|
| Token Telegram bot | `firebase functions:config:set telegram.bot_token="..." telegram.chat_id="..."` | **Có** |
| `GEMINI_API_KEY` | `firebase functions:secrets:set GEMINI_API_KEY` — chỉ máy chủ đọc, **không** đưa vào bundle client | **Có** |
| `FIREBASE_SERVICE_ACCOUNT` | GitHub Secrets — chìa khoá để CI deploy | **Có, mạnh nhất** |
| Cấu hình Firebase phía client | `.env` (đã gitignore), GitHub Secrets, hoặc giá trị dự phòng trong `services/firebaseConfig.ts` | **Không** — công khai theo thiết kế, rơ-le bảo vệ là `firestore.rules` |

⚠️ Mọi biến bắt đầu bằng `VITE_` đều được đóng gói thẳng vào phần chạy trên
trình duyệt — ai xem mã trang cũng đọc được. **Không bao giờ** đặt khoá Gemini
hay token Telegram dưới tiền tố này.

Việc gửi email đi qua callable function `sendAppEmail` (có kiểm tra đăng nhập).
Client **không** ghi thẳng vào collection `mail` — rules đã khoá, vì mở ra đồng
nghĩa ai cũng gửi được email mang tên miền này.

## 🌐 Bản đang chạy

🔗 **https://antoan.web.app**

## 📄 License

Private project - All rights reserved

---

Built with ❤️ for Occupational Safety in Vietnam
