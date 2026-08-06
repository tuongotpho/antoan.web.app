import { storage, storageRef, uploadBytes, getDownloadURL } from '../services/firebaseConfig';

/**
 * Upload file to Firebase Storage
 * @param file - File to upload
 * @param folder - Storage folder (e.g., 'chat-attachments')
 * @param userId - User ID for unique filename
 * @returns Download URL of uploaded file
 */
export const uploadFile = async (file: File, folder: string, userId: string): Promise<string> => {
  const timestamp = Date.now();
  // Đặt uid thành THƯ MỤC chứ không phải tiền tố tên file. Storage rules chỉ
  // so khớp được theo đoạn đường dẫn, nên `folder/uid_file.png` không thể ràng
  // buộc quyền theo chủ sở hữu, còn `folder/uid/file.png` thì có.
  const filename = `${timestamp}_${file.name}`;
  const filePath = `${folder}/${userId}/${filename}`;
  const fileRef = storageRef(storage, filePath);

  // Upload file
  await uploadBytes(fileRef, file);

  // Get download URL
  const downloadURL = await getDownloadURL(fileRef);
  return downloadURL;
};

/**
 * Get file type from mime type
 * @param mimeType - File mime type
 * @returns File type category
 */
export const getFileType = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'document';
};

/**
 * Format file size to human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate file for upload
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in MB (default 10MB)
 * @returns Error message if invalid, null if valid
 */
export const validateFile = (file: File, maxSizeMB: number = 10): string | null => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return `File quá lớn. Kích thước tối đa: ${maxSizeMB}MB`;
  }

  // Allow images, PDFs, and common document formats
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];

  if (!allowedTypes.includes(file.type)) {
    return 'Định dạng file không được hỗ trợ. Chỉ chấp nhận: hình ảnh, PDF, Word, Excel, Text';
  }

  return null;
};
