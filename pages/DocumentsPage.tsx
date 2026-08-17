import React, { useState, useEffect, useContext } from 'react';
import {
  db,
  storage,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  increment,
  storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from '../services/firebaseConfig';
import { Document } from '../types';
import SEOHead from '../components/SEOHead';
import { AppContext } from '../App';

const DocumentUploadForm: React.FC<{ onUploadSuccess: () => void }> = ({ onUploadSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !file) {
      setError('Vui lòng điền đầy đủ thông tin và chọn tệp.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const fileRef = storageRef(storage, `documents/${fileName}`);
      const uploadResult = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      const documentsCollection = collection(db, 'documents');
      await addDoc(documentsCollection, {
        title,
        description,
        downloadUrl,
        fileName: fileName,
        createdAt: serverTimestamp(),
        viewCount: 0,
        downloadCount: 0,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setFile(null);
      if (e.target instanceof HTMLFormElement) {
        e.target.reset();
      }
      onUploadSuccess();
    } catch (err: any) {
      console.error('Error uploading document: ', err);
      if (err.code === 'storage/unauthorized') {
        setError(
          `Lỗi phân quyền. Tài khoản của bạn không có quyền đăng tải tệp. Vui lòng kiểm tra lại Firebase Storage Rules. Quy tắc cần cho phép ghi ('allow write') vào đường dẫn 'documents/' đối với những tài khoản admin (có document UID tồn tại trong collection 'admins' của Firestore).`
        );
      } else {
        setError('Đã xảy ra lỗi khi đăng tải. Vui lòng thử lại.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-neutral-dark mb-4">Đăng tài liệu mới</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Tiêu đề tài liệu (*)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
          required
        />
        <textarea
          placeholder="Mô tả ngắn (*)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg"
          required
        />
        <input
          type="file"
          onChange={handleFileChange}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          required
        />
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg"
            role="alert"
          >
            <p className="font-bold">Lỗi!</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={uploading}
          className="w-full flex justify-center items-center bg-primary text-white font-bold py-3 rounded-lg hover:opacity-90 transition duration-300 disabled:bg-primary-dark disabled:opacity-75 disabled:cursor-wait"
        >
          {uploading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Đang tải lên...</span>
            </>
          ) : (
            'Đăng Tải'
          )}
        </button>
      </form>
    </div>
  );
};

const DocumentItem: React.FC<{
  doc: Document;
  isAdmin: boolean;
  onDelete: (id: string, fileName: string) => void;
}> = ({ doc: document, isAdmin, onDelete }) => {
  const handleView = async () => {
    try {
      const docRef = doc(db, 'documents', document.id);
      await updateDoc(docRef, {
        viewCount: increment(1),
      });
    } catch (error) {
      console.error('Error updating view count: ', error);
    }
  };

  const handleDownload = async () => {
    try {
      const docRef = doc(db, 'documents', document.id);
      await updateDoc(docRef, {
        downloadCount: increment(1),
      });
    } catch (error) {
      console.error('Error updating download count: ', error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col h-full">
      <div className="flex-1">
        <h3 className="text-lg font-bold text-neutral-dark mb-2">{document.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{document.description}</p>
      </div>
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
        <div className="flex space-x-4 text-sm text-gray-500">
          <span className="flex items-center">
            <i className="fas fa-eye mr-1"></i> {document.viewCount}
          </span>
          <span className="flex items-center">
            <i className="fas fa-download mr-1"></i> {document.downloadCount}
          </span>
        </div>
        <div className="flex space-x-2 flex-shrink-0">
          <a
            href={document.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition duration-300 text-sm"
            onClick={handleDownload}
          >
            <i className="fas fa-download mr-1"></i>Tải
          </a>
          <a
            href={document.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition duration-300 text-sm"
            onClick={handleView}
          >
            <i className="fas fa-eye mr-1"></i>Xem
          </a>
        </div>
      </div>
    </div>
  );
};

const DocumentsPage: React.FC = () => {
  const { isAdmin } = useContext(AppContext);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const documentsCollection = collection(db, 'documents');
      const q = query(documentsCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const docsData = snapshot.docs.map(
        (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Document
      );
      setDocuments(docsData);
    } catch (error) {
      console.error('Error fetching documents: ', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDeleteDocument = async (id: string, fileName: string) => {
    setActionError('');
    if (
      window.confirm(
        'Bạn có chắc chắn muốn xóa tài liệu này? Hành động này sẽ xóa cả tệp đính kèm.'
      )
    ) {
      try {
        // Delete file from Storage
        const fileRef = storageRef(storage, `documents/${fileName}`);
        await deleteObject(fileRef);

        // Delete document from Firestore
        const docRef = doc(db, 'documents', id);
        await deleteDoc(docRef);

        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      } catch (error: any) {
        console.error('Error deleting document: ', error);
        if (error.code === 'storage/unauthorized') {
          setActionError(
            'Lỗi phân quyền: Bạn không có quyền xóa tệp này. Vui lòng kiểm tra lại Firebase Storage Rules.'
          );
        } else {
          setActionError('Đã xảy ra lỗi khi xóa tài liệu.');
        }
      }
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Trang này nằm trong sitemap nhưng trước đây không có thẻ SEO riêng, nên
          Google thấy tiêu đề và mô tả trùng hệt trang chủ. */}
      <SEOHead
        title="Tài Liệu & Biểu Mẫu An Toàn Lao Động | SafetyConnect"
        description="Kho tài liệu, quy định pháp luật và biểu mẫu về an toàn lao động, tải miễn phí. Cập nhật theo Nghị định 44/2016/NĐ-CP và các văn bản hiện hành."
        url="https://antoan.web.app/documents"
        keywords={[
          'tài liệu an toàn lao động',
          'biểu mẫu an toàn lao động',
          'nghị định 44 an toàn lao động',
          'quy định an toàn lao động',
        ]}
      />
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-dark mb-2">
          Tài Liệu & Biểu Mẫu
        </h1>
        <p className="text-gray-600">
          Các tài liệu, quy định và biểu mẫu hữu ích liên quan đến an toàn lao động.
        </p>
      </div>

      {isAdmin && <DocumentUploadForm onUploadSuccess={fetchDocuments} />}

      {actionError && (
        <div
          className="max-w-4xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6"
          role="alert"
        >
          <p>{actionError}</p>
        </div>
      )}

      {/* Ẩn khỏi mắt nhưng giữ trong mục lục trang: thẻ tài liệu dùng h3, trên
          nó chỉ có h1 tên trang, nhảy h1 -> h3 làm khuyết một cấp. */}
      <h2 className="sr-only">Danh sách tài liệu</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {loading ? (
          <p className="text-center text-gray-500 col-span-full">Đang tải tài liệu...</p>
        ) : documents.length > 0 ? (
          documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              doc={doc}
              isAdmin={isAdmin}
              onDelete={handleDeleteDocument}
            />
          ))
        ) : (
          <div className="text-center text-gray-500 pt-6 col-span-full">
            <p>Chưa có tài liệu nào được đăng tải.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
