import React, { useState, useEffect, useCallback } from 'react';
import {
  db,
  storage,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  storageRef,
  uploadBytes,
  getDownloadURL,
  type User,
} from '../services/firebaseConfig';
import { BlogComment } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ImageLightbox from './ImageLightbox';
import { compressImage, formatFileSize } from '../utils/imageCompression';
import { lamSachTenFile } from '../utils/fileUpload';

// Giới hạn độ dài bình luận. Trước đây không có, nên một bình luận dài hàng
// trăm nghìn ký tự vẫn lưu được — vừa tốn dung lượng, vừa phá vỡ bố cục trang.
const DO_DAI_TOI_DA = 5000;

interface BlogCommentSectionProps {
  postId: string;
  currentUser: User | null;
}

const BlogCommentSection: React.FC<BlogCommentSectionProps> = ({ postId, currentUser }) => {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [compressing, setCompressing] = useState(false);

  // Check if user is admin
  const isAdmin = currentUser?.email === 'thanhlv87@gmail.com';

  useEffect(() => {
    const commentsCollection = collection(db, 'blogComments');
    const q = query(
      commentsCollection,
      where('postId', '==', postId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as BlogComment
      );
      // Sort on client side to avoid composite index error
      commentsData.sort((a, b) => {
        const timeA = a.createdAt?.toDate()?.getTime() || 0;
        const timeB = b.createdAt?.toDate()?.getTime() || 0;
        return timeB - timeA;
      });
      setComments(commentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const maxImages = 5;

      if (files.length + imageFiles.length > maxImages) {
        alert(`Bạn chỉ có thể tải lên tối đa ${maxImages} ảnh`);
        return;
      }

      // Chốt định dạng: trước đây chọn file gì cũng nhận, kể cả PDF hay .exe.
      // Hàm nén ảnh sẽ vỡ giữa chừng, còn storage.rules thì chỉ từ chối sau khi
      // người dùng đã chờ tải xong — cả hai đều cho ra một lỗi khó hiểu.
      const khongPhaiAnh = files.filter((f) => !f.type.startsWith('image/'));
      if (khongPhaiAnh.length > 0) {
        alert(
          `Chỉ nhận file ảnh. Các file sau không phải ảnh: ${khongPhaiAnh
            .map((f) => f.name)
            .join(', ')}`
        );
        return;
      }

      // Chốt kích thước ảnh gốc. Ảnh sẽ được nén ngay sau đây, nhưng một file
      // 200MB vẫn đủ làm treo trình duyệt trước khi kịp nén.
      const GIOI_HAN_MB = 20;
      const quaLon = files.filter((f) => f.size > GIOI_HAN_MB * 1024 * 1024);
      if (quaLon.length > 0) {
        alert(`Ảnh quá lớn (tối đa ${GIOI_HAN_MB}MB mỗi ảnh): ${quaLon.map((f) => f.name).join(', ')}`);
        return;
      }

      setCompressing(true);
      try {
        // Compress images before adding
        const compressedFiles: File[] = [];
        const newPreviewUrls: string[] = [];

        for (const file of files) {
          const originalSize = file.size;
          const compressedBlob = await compressImage(file, {
            maxWidth: 1080,
            maxHeight: 1080,
            quality: 0.8,
          });
          const compressedFile = new File([compressedBlob], file.name, { type: file.type });
          const compressedSize = compressedFile.size;

          // Chỉ báo khi nén không ăn thua (ảnh sau nén vẫn gần bằng ảnh gốc),
          // vì đó mới là thứ đáng chú ý. Trước đây log mọi lần, làm ngập console.
          if (compressedSize > originalSize * 0.9) {
            console.warn(
              `Nén ít tác dụng với ${file.name}: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)}`
            );
          }

          compressedFiles.push(compressedFile);
          newPreviewUrls.push(URL.createObjectURL(compressedBlob));
        }

        setImageFiles([...imageFiles, ...compressedFiles]);
        setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
      } catch (error) {
        console.error('Error compressing images:', error);
        alert('Có lỗi khi nén ảnh. Vui lòng thử lại.');
      } finally {
        setCompressing(false);
      }
    }
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newUrls = imagePreviewUrls.filter((_, i) => i !== index);
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImageFiles(newFiles);
    setImagePreviewUrls(newUrls);
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    const uploadPromises = imageFiles.map(async (file, i) => {
      // Tên file do người dùng đặt nên phải làm sạch trước khi ghép vào đường
      // dẫn. Trước đây ghép thẳng file.name, dẫn tới hai chuyện:
      //   - tên chứa dấu gạch chéo sinh thêm cấp thư mục, mà storage.rules chỉ
      //     khớp đúng blog-comments/{postId}/{imageId} — lệch một cấp là rơi
      //     vào default deny và ảnh không tải lên được
      //   - tên chứa ? hoặc # làm hỏng địa chỉ tải ảnh về
      // Thêm chỉ số i để hai ảnh chọn cùng lúc không đè lên nhau khi Date.now()
      // trả về cùng một mốc.
      const tenSach = lamSachTenFile(file.name);
      const fileName = `blog-comments/${postId}/${Date.now()}_${i}_${tenSach}`;
      const imageRef = storageRef(storage, fileName);
      await uploadBytes(imageRef, file);
      return await getDownloadURL(imageRef);
    });

    return await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      alert('Vui lòng đăng nhập để bình luận');
      return;
    }

    if (!commentText.trim() && imageFiles.length === 0) {
      alert('Vui lòng nhập nội dung hoặc chọn ảnh');
      return;
    }

    if (commentText.length > DO_DAI_TOI_DA) {
      alert(
        `Bình luận quá dài (${commentText.length.toLocaleString('vi-VN')} ký tự). ` +
          `Tối đa ${DO_DAI_TOI_DA.toLocaleString('vi-VN')} ký tự.`
      );
      return;
    }

    setSubmitting(true);
    try {
      // Upload images if any
      const imageUrls = await uploadImages();

      // Create comment
      await addDoc(collection(db, 'blogComments'), {
        postId,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email || 'Admin',
        authorEmail: currentUser.email || '',
        authorRole: isAdmin ? 'admin' : 'user',
        content: commentText.trim(),
        images: imageUrls,
        createdAt: serverTimestamp(),
      });

      // Reset form
      setCommentText('');
      setImageFiles([]);
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setImagePreviewUrls([]);

      alert('Bình luận đã được đăng thành công!');
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Có lỗi xảy ra khi đăng bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

    try {
      await deleteDoc(doc(db, 'blogComments', commentId));
      alert('Đã xóa bình luận');
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Không thể xóa bình luận');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Memoize onClose to prevent unnecessary re-renders
  const handleCloseLightbox = useCallback(() => {
    setShowLightbox(false);
  }, []);

  if (loading) {
    return <LoadingSpinner size="small" message="Đang tải bình luận..." />;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <i className="fas fa-comments text-primary"></i>
        Bình luận ({comments.length})
      </h3>

      {/* Comment Form - Only for logged in users */}
      {currentUser && (
        <form onSubmit={handleSubmit} className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              {currentUser.displayName?.charAt(0).toUpperCase() ||
                currentUser.email?.charAt(0).toUpperCase() ||
                'U'}
            </div>
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Viết bình luận của bạn (có thể đính kèm ảnh)..."
              />

              {/* Image Preview */}
              {imagePreviewUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 mt-3">
                {/* Image Upload - All users can upload */}
                <label
                  className={`cursor-pointer transition-colors ${compressing ? 'text-gray-400' : 'text-gray-600 hover:text-primary'}`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={submitting || compressing}
                  />
                  {compressing ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Đang nén ảnh...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-image mr-2"></i>
                      Thêm ảnh ({imageFiles.length}/5)
                    </>
                  )}
                </label>

                <button
                  type="submit"
                  disabled={submitting || (!commentText.trim() && imageFiles.length === 0)}
                  className="ml-auto bg-gradient-to-r from-primary to-orange-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span>Đang đăng...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      <span>Đăng bình luận</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Login Prompt */}
      {!currentUser && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 flex items-center gap-2">
            <i className="fas fa-info-circle text-blue-500"></i>
            Vui lòng{' '}
            <a href="/login" className="text-primary hover:underline font-semibold">
              đăng nhập
            </a>{' '}
            để bình luận
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-comment-slash text-4xl mb-3"></i>
            <p>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-0">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                    comment.authorRole === 'admin'
                      ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                      : 'bg-gradient-to-br from-gray-400 to-gray-600'
                  }`}
                >
                  {comment.authorName.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{comment.authorName}</span>
                    {comment.authorRole === 'admin' && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        <i className="fas fa-shield-alt mr-1"></i>
                        Admin
                      </span>
                    )}
                    <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
                  </div>

                  <p className="text-gray-700 mb-2 whitespace-pre-wrap">{comment.content}</p>

                  {/* Comment Images */}
                  {comment.images && comment.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                      {comment.images.map((imageUrl, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setLightboxImages(comment.images || []);
                            setLightboxIndex(index);
                            setShowLightbox(true);
                          }}
                          className="block relative group overflow-hidden rounded-lg"
                        >
                          <img
                            src={imageUrl}
                            alt={`Comment image ${index + 1}`}
                            className="w-full h-32 object-cover transition-transform group-hover:scale-110 cursor-pointer"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <i className="fas fa-search-plus text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity"></i>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Delete button - Only for comment author or admin */}
                  {currentUser && (currentUser.uid === comment.authorId || isAdmin) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                      <i className="fas fa-trash mr-1"></i>
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Lightbox */}
      {showLightbox && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={handleCloseLightbox}
        />
      )}
    </div>
  );
};

export default BlogCommentSection;
