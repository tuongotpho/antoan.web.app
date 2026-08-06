# 📱 Hướng Dẫn Cấu Hình Telegram Bot

## 🤖 Thông Tin Bot

- **Bot Name**: @Antoanketnoi_bot
- **Bot Token**: KHÔNG ghi token vào tài liệu hay mã nguồn.

> ⚠️ Token cũ từng nằm cứng trong `functions/index.js` và trong chính file này,
> trên một repo công khai — coi như đã lộ. Hãy thu hồi qua @BotFather rồi nạp
> token mới bằng lệnh:
>
> ```
> firebase functions:config:set telegram.bot_token="TOKEN_MOI" telegram.chat_id="CHAT_ID"
> ```

## 📋 Các Bước Cấu Hình

### Bước 1: Lấy Chat ID

1. Mở Telegram trên điện thoại hoặc máy tính
2. Tìm kiếm bot: `@Antoanketnoi_bot`
3. Nhấn **Start** hoặc gửi tin nhắn `/start`
4. Mở trình duyệt và truy cập URL sau:

```
https://api.telegram.org/bot<TOKEN_CUA_BAN>/getUpdates
```

5. Tìm phần `"chat":{"id": 123456789}` - đây là **Chat ID** của bạn

**Ví dụ response:**

```json
{
  "ok": true,
  "result": [
    {
      "message": {
        "chat": {
          "id": 123456789,  <-- ĐÂY LÀ CHAT ID
          "first_name": "Your Name",
          "type": "private"
        }
      }
    }
  ]
}
```

### Bước 2: Cấu Hình Firebase

Chạy lệnh sau để set Chat ID (thay `YOUR_CHAT_ID` bằng số bạn vừa lấy):

```bash
firebase functions:config:set telegram.chat_id="YOUR_CHAT_ID"
```

**Ví dụ:**

```bash
firebase functions:config:set telegram.chat_id="123456789"
```

Kiểm tra config:

```bash
firebase functions:config:get
```

### Bước 3: Deploy Cloud Function

```bash
firebase deploy --only functions
```

## 🧪 Test Thông Báo

Sau khi deploy, bạn có thể test bằng cách:

1. **Tạo training request mới** trên website → Bot sẽ gửi thông báo tự động
2. **Hoặc dùng Firebase Console** để gọi function `testTelegramNotification`

## 📝 Tin Nhắn Mẫu

Khi có yêu cầu đào tạo mới, bot sẽ gửi:

```
🔔 YÊU CẦU ĐÀO TẠO MỚI

⚡ An toàn Điện

👤 Người liên hệ: Nguyễn Văn A
🏢 Công ty: ABC Company
📧 Email: contact@abc.com
📱 Điện thoại: 0912345678
📍 Địa điểm: Hà Nội
👥 Số học viên: 20 người
📅 Dự kiến bắt đầu: 15/12/2025

⏰ Thời gian: 15/11/2025 20:30:45

🔗 Xem chi tiết
```

## 🔧 Troubleshooting

### Không nhận được thông báo?

1. Kiểm tra Chat ID đã set đúng chưa:

   ```bash
   firebase functions:config:get
   ```

2. Kiểm tra logs của function:

   ```bash
   firebase functions:log
   ```

3. Đảm bảo đã nhấn **Start** với bot trên Telegram

### Lỗi "chat not found"?

- Bot chỉ gửi được tin nhắn cho users đã nhấn Start
- Đảm bảo bạn đã mở chat với bot `@Antoanketnoi_bot`

## 🔒 Bảo Mật

**LƯU Ý QUAN TRỌNG:**

- Bot Token đã được hard-code trong `functions/index.js`
- Không public file này lên GitHub public repository
- Nên dùng Firebase Secret Manager trong production:

```bash
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
```

## 📚 Tài Liệu Tham Khảo

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
