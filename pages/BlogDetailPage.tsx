import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  db,
  auth,
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
} from '../services/firebaseConfig';
import { BlogPost } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import BlogCard from '../components/BlogCard';
import LazyImage from '../components/LazyImage';
import BlogCommentSection from '../components/BlogCommentSection';
import SEOHead from '../components/SEOHead';
import { AppContext } from '../App';

const BlogDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useContext(AppContext);
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!slug) {
          setError('Không tìm thấy bài viết');
          setLoading(false);
          return;
        }

        setLoading(true);

        // Try to find post by slug first
        let postData: BlogPost | null = null;
        const slugQuery = isAdmin
          ? query(
              collection(db, 'blogPosts'),
              where('slug', '==', slug),
              firestoreLimit(1)
            )
          : query(
              collection(db, 'blogPosts'),
              where('slug', '==', slug),
              where('published', '==', true),
              firestoreLimit(1)
            );
        const slugSnapshot = await getDocs(slugQuery);

        if (!slugSnapshot.empty) {
          const postDoc = slugSnapshot.docs[0];
          postData = { id: postDoc.id, ...postDoc.data() } as BlogPost;
        } else {
          // Fallback: try to find by document ID (backward compatibility)
          const postRef = doc(db, 'blogPosts', slug);
          const postDoc = await getDoc(postRef);
          if (postDoc.exists()) {
            postData = { id: postDoc.id, ...postDoc.data() } as BlogPost;
          }
        }

        if (!postData) {
          setError('Bài viết không tồn tại');
          setLoading(false);
          return;
        }

        setPost(postData);

        // Add JSON-LD Structured Data for SEO (Google Rich Results)
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        if (existingScript) {
          existingScript.remove();
        }

        const structuredData = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: postData.title,
          description: postData.excerpt,
          image: postData.coverImage,
          datePublished:
            postData.publishedAt?.toDate().toISOString() ||
            postData.createdAt?.toDate().toISOString(),
          dateModified:
            postData.updatedAt?.toDate().toISOString() ||
            postData.createdAt?.toDate().toISOString(),
          author: {
            '@type': 'Person',
            name: postData.author.name,
            email: postData.author.email,
          },
          publisher: {
            '@type': 'Organization',
            name: 'SafetyConnect',
            logo: {
              '@type': 'ImageObject',
              url: 'https://raw.githubusercontent.com/thanhlv87/pic/refs/heads/main/connected.png',
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${window.location.origin}/blog/${postData.slug || slug}`,
          },
          keywords: postData.tags.join(', '),
          articleSection: postData.category,
          inLanguage: 'vi-VN',
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(structuredData);
        document.head.appendChild(script);

        // Increment view count (silently fail if not authorized)
        try {
          // Use document ID for update, not slug
          const postRef = doc(db, 'blogPosts', postData.id);
          await updateDoc(postRef, {
            viewCount: increment(1),
          });
        } catch (_error) {
          // Ignore permission errors for view count
        }

        // Fetch related posts (same category, filter and sort on client to avoid composite index and permission errors)
        const relatedQuery = query(
          collection(db, 'blogPosts'),
          where('category', '==', postData.category),
          where('published', '==', true),
          firestoreLimit(15)
        );
        const relatedSnapshot = await getDocs(relatedQuery);
        const related = relatedSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as BlogPost)
          .filter((p) => p.id !== postData!.id)
          .sort((a, b) => {
            const timeA = a.publishedAt?.toDate().getTime() || a.createdAt?.toDate().getTime() || 0;
            const timeB = b.publishedAt?.toDate().getTime() || b.createdAt?.toDate().getTime() || 0;
            return timeB - timeA;
          })
          .slice(0, 3);
        setRelatedPosts(related);

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching post:', err);
        setError('Không thể tải bài viết');
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser((prevUser) => {
        if (prevUser?.uid !== user?.uid) {
          return user;
        }
        return prevUser;
      });
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="large" message="Đang tải bài viết..." />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-12">
        {/* Thẻ SEO của bài viết nằm dưới phần hiển thị chính, mà nhánh này
            thoát trước — nên người mở link một bài đã xoá sẽ thấy tiêu đề tab
            của trang vừa xem, không hiểu chuyện gì. */}
        <SEOHead
          title="Không tìm thấy bài viết | SafetyConnect"
          description="Bài viết này không tồn tại hoặc đã được gỡ."
        />
        <div className="max-w-2xl mx-auto text-center bg-white rounded-lg shadow-lg p-12">
          <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
          {/* h1: nhánh này là toàn bộ nội dung trang khi bài viết không tồn
              tại. Cùng lý do với nhánh chưa đăng nhập ở ChatPage. */}
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy bài viết</h1>
          <p className="text-gray-600 mb-6">
            {error || 'Bài viết này không tồn tại hoặc đã được gỡ khỏi trang.'}
          </p>
          <button
            onClick={() => navigate('/blog')}
            className="bg-gradient-to-r from-primary to-orange-500 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all"
          >
            Quay lại Blog
          </button>
        </div>
      </div>
    );
  }

  const blogUrl = `${window.location.origin}/blog/${post.slug || slug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Meta Tags */}
      <SEOHead
        title={`${post.title} | SafetyConnect`}
        description={post.excerpt}
        image={post.coverImage}
        url={blogUrl}
        type="article"
        keywords={post.tags}
        author={post.author.name}
        publishedTime={
          post.publishedAt?.toDate().toISOString() || post.createdAt?.toDate().toISOString()
        }
        modifiedTime={
          post.updatedAt?.toDate().toISOString() || post.createdAt?.toDate().toISOString()
        }
      />

      {/* Back Button */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/blog')}
            className="text-primary hover:text-orange-500 font-semibold flex items-center gap-2 transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            Quay lại Blog
          </button>
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative h-96 bg-gray-900">
        <LazyImage
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-gradient-to-r from-primary to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              {post.category}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-bold">
                  {post.author.name.charAt(0).toUpperCase()}
                </div>
                <span>{post.author.name}</span>
              </div>
              <span>•</span>
              <span>
                <i className="fas fa-calendar-alt mr-2"></i>
                {formatDate(post.publishedAt || post.createdAt)}
              </span>
              <span>•</span>
              <span>
                <i className="fas fa-eye mr-2"></i>
                {post.viewCount} lượt xem
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Excerpt */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <p className="text-xl text-gray-700 italic border-l-4 border-primary pl-6">
              {post.excerpt}
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 mb-8">
            <div
              className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-a:text-primary prose-strong:text-gray-800 prose-ul:text-gray-700 prose-ol:text-gray-700"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Social Sharing */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <i className="fas fa-share-alt text-primary"></i>
              Chia sẻ bài viết
            </h3>
            <div className="flex flex-wrap gap-3">
              {/* Facebook Share */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(blogUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
              >
                <i className="fab fa-facebook-f"></i>
                Facebook
              </a>

              {/* Zalo Share */}
              <a
                href={`https://chat.zalo.me/?url=${encodeURIComponent(blogUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors"
              >
                <i className="fas fa-comment-dots"></i>
                Zalo
              </a>

              {/* Copy Link */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(blogUrl);
                  alert('Đã sao chép link!');
                }}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <i className="fas fa-link"></i>
                Sao chép link
              </button>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <i className="fas fa-tags text-primary"></i>
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <BlogCommentSection postId={post.id} currentUser={currentUser} />

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <i className="fas fa-newspaper text-primary"></i>
                Bài viết liên quan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <BlogCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogDetailPage;
