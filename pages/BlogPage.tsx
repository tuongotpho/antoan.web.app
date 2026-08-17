import React, { useState, useEffect } from 'react';
import { cuonLenDau } from '../utils/cuonTrang';
import { khopTuKhoaBaiViet } from '../utils/locYeuCau';
import { useNavigate } from 'react-router-dom';
import {
  db,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit as firestoreLimit,
  getDocs,
} from '../services/firebaseConfig';
import { BlogPost } from '../types';
import BlogCard from '../components/BlogCard';
import LoadingSpinner from '../components/LoadingSpinner';
import SEOHead from '../components/SEOHead';

const POSTS_PER_PAGE = 10;

const BlogPage: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const postsCollection = collection(db, 'blogPosts');
    const q = query(
      postsCollection,
      where('published', '==', true),
      orderBy('publishedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as BlogPost
      );
      setPosts(postsData);
      setFilteredPosts(postsData);
      setLoading(false);

      // Extract unique categories
      const uniqueCategories = Array.from(new Set(postsData.map((p) => p.category)));
      setCategories(uniqueCategories);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = posts;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((post) => post.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((post) => khopTuKhoaBaiViet(post, searchQuery));
    }

    setFilteredPosts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedCategory, searchQuery, posts]);

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    cuonLenDau();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <LoadingSpinner size="large" message="Đang tải bài viết..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title="Blog & Kiến thức An toàn Lao động | SafetyConnect"
        description="Cập nhật tin tức, kiến thức, quy định pháp luật về An toàn Lao động. Hướng dẫn, case study và kinh nghiệm thực tế từ các chuyên gia ATVSLĐ."
        url={window.location.href}
        type="website"
        keywords={[
          'blog an toàn lao động',
          'kiến thức ATVSLĐ',
          'tin tức an toàn lao động',
          'quy định an toàn lao động',
          'hướng dẫn ATVSLĐ',
          'case study an toàn',
          'SafetyConnect blog',
        ]}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-orange-500 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <i className="fas fa-newspaper mr-3"></i>
              Blog & Kiến thức
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              Cập nhật tin tức, kiến thức về An toàn Lao động và các quy định pháp luật mới nhất
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pl-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary shadow-md"
              />
              <i className="fas fa-search absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
              }`}
            >
              Tất cả ({posts.length})
            </button>
            {categories.map((category) => {
              const count = posts.filter((p) => p.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 rounded-full font-semibold transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
                  }`}
                >
                  {category} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-gray-600">
          Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredPosts.length)} trong tổng số{' '}
          {filteredPosts.length} bài viết
        </div>

        {/* Blog Grid */}
        {currentPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-lg">
            <i className="fas fa-search text-5xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy bài viết</h3>
            <p className="text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {currentPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg bg-white shadow hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first, last, current, and pages around current
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          page === currentPage
                            ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-md'
                            : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-2 text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg bg-white shadow hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BlogPage;
