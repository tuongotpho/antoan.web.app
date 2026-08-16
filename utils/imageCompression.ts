/**
 * Image compression utility for blog comments
 * Automatically resize images to max 1080px and compress to reduce file size
 */

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compress and resize image file
 * @param file - Original image file
 * @param options - Compression options
 * @returns Compressed image blob
 */
export async function compressImage(file: File, options: CompressImageOptions = {}): Promise<Blob> {
  const { maxWidth = 1080, maxHeight = 1080, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        // Only resize if image is larger than max dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Chọn định dạng đầu ra.
        //
        // PNG và các định dạng không mất dữ liệu BỎ QUA tham số chất lượng —
        // đưa quality vào cũng vô ích, ảnh chỉ được thu nhỏ chứ không hề nén.
        // Ảnh chụp màn hình thường là PNG và rất nặng, nên đây là đúng loại
        // ảnh cần nén nhất mà lại không được nén.
        //
        // Chuyển sang JPEG cho những định dạng đó. Ảnh GIF giữ nguyên vì có
        // thể là ảnh động, chuyển sang JPEG sẽ mất chuyển động.
        const giuNguyenDinhDang = ['image/jpeg', 'image/webp', 'image/gif'];
        const dinhDangRa = giuNguyenDinhDang.includes(file.type) ? file.type : 'image/jpeg';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Nếu "nén" xong lại to hơn ảnh gốc thì giữ ảnh gốc.
            //
            // Chuyện này có thật: ảnh đã được nén sẵn ở mức cao, đem giải ra
            // rồi nén lại ở mức 0.8 có thể phình lên. Trước đây luôn lấy bản
            // vừa tạo, tức có lúc làm ảnh nặng thêm.
            //
            // Chỉ áp dụng khi ảnh không phải thu nhỏ kích thước, vì nếu đã thu
            // nhỏ thì bản mới luôn đáng dùng hơn.
            const daThuNho = width !== img.width || height !== img.height;
            if (!daThuNho && blob.size >= file.size) {
              resolve(file);
              return;
            }

            resolve(blob);
          },
          dinhDangRa,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Xuất lại hàm hiển thị dung lượng từ utils/fileUpload.
 *
 * TRƯỚC ĐÂY file này có một bản chép riêng, và bản đó vẫn mang lỗi cũ: không
 * chặn số âm hay giá trị không hợp lệ, và chỉ có đơn vị tới GB nên file lớn
 * hơn cho ra chuỗi "1 undefined". Bản trong fileUpload đã được vá, nhưng phần
 * bình luận blog lại nạp bản ở đây — nên bản vá chỉ ăn một nửa.
 *
 * Giữ tên xuất khẩu để các nơi đang dùng không phải sửa gì.
 */
export { formatFileSize } from './fileUpload';
