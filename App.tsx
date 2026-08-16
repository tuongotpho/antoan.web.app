import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  auth,
  db,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  type User,
} from './services/firebaseConfig';
import { TrainingRequest } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { useUnreadMessages } from './hooks/useUnreadMessages';

const LoginModal = lazy(() => import('./components/LoginModal'));

export type PartnerStatus = 'pending' | 'approved' | 'rejected' | null;

// Create a context to share auth and app state
export const AppContext = React.createContext<{
  user: User | null;
  isAdmin: boolean;
  partnerStatus: PartnerStatus;
  trainingRequests: TrainingRequest[];
  loadingAuth: boolean;
  loadingRequests: boolean;
  unreadCount: number;
  onLoginRequired: () => void;
}>({
  user: null,
  isAdmin: false,
  partnerStatus: null,
  trainingRequests: [],
  loadingAuth: true,
  loadingRequests: true,
  unreadCount: 0,
  onLoginRequired: () => {},
});

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [trainingRequests, setTrainingRequests] = useState<TrainingRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const location = useLocation();

  // Get unread messages count
  const unreadCount = useUnreadMessages(user, isAdmin, partnerStatus);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAdmin(false);
      setPartnerStatus(null);

      if (currentUser) {
        // Check for admin privileges
        const adminDocRef = doc(db, 'admins', currentUser.uid);
        const adminDoc = await getDoc(adminDocRef);
        if (adminDoc.exists()) {
          setIsAdmin(true);
        } else {
          // If not admin, check for partner status
          const partnerDocRef = doc(db, 'partners', currentUser.uid);
          const partnerDoc = await getDoc(partnerDocRef);
          if (partnerDoc.exists()) {
            const partnerData = partnerDoc.data();
            setPartnerStatus(partnerData?.status || 'pending');
          }
        }
      } else {
        setIsAdmin(false);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setTrainingRequests([]);
      setLoadingRequests(false);
      return;
    }

    const requestsCollection = collection(db, 'trainingRequests');
    const q = query(requestsCollection, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const requests: TrainingRequest[] = [];
        querySnapshot.forEach((docSnap) => {
          requests.push({ id: docSnap.id, ...docSnap.data() } as TrainingRequest);
        });
        setTrainingRequests(requests);
        setLoadingRequests(false);
      },
      (error) => {
        console.error('Error fetching training requests: ', error);
        setLoadingRequests(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Get current page from location
  const getCurrentPage = (): string => {
    const pathname = location.pathname;
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/blog/')) return 'blog-detail';
    if (pathname.startsWith('/blog')) return 'blog';
    if (pathname.startsWith('/requests')) return 'requests';
    if (pathname.startsWith('/documents')) return 'documents';
    if (pathname.startsWith('/chat')) return 'chat';
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/training-')) return pathname.slice(1);
    return 'home';
  };

  // Context value for child pages
  const contextValue = {
    user,
    isAdmin,
    partnerStatus,
    trainingRequests,
    loadingAuth,
    loadingRequests,
    unreadCount,
    onLoginRequired: () => setLoginModalOpen(true),
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen flex flex-col font-sans">
        <Header
          user={user}
          isAdmin={isAdmin}
          onLoginClick={() => setLoginModalOpen(true)}
          currentPage={getCurrentPage()}
          partnerStatus={partnerStatus}
          unreadCount={unreadCount}
        />
        <main className="flex-grow">
          {/* key theo đường dẫn: đổi trang là dựng lại lớp bắt lỗi.

              TRƯỚC ĐÂY không có key, nên khi một trang gặp lỗi thì trạng thái
              "đang lỗi" nằm lại mãi: người dùng bấm menu sang trang khác vẫn
              thấy màn hình "Đã xảy ra lỗi", vì lớp bắt lỗi không được dựng lại.
              Kẹt cho tới khi tải lại cả trang — mà nhiều người sẽ bỏ đi trước
              khi nghĩ tới việc đó. */}
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<LoadingSpinner size="fullscreen" message="Đang tải..." />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
        <Footer />
        
        {/* Floating Zalo Button */}
        <a
          href="https://zalo.me/0982722036"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#0068FF] text-white rounded-full shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300 group"
          title="Chat qua Zalo"
          id="zalo-floating-button"
        >
          <span className="absolute right-16 bg-white text-neutral-dark text-sm font-semibold px-3 py-1.5 rounded-lg shadow-md border opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
            Chat Zalo: 0982 722 036
          </span>
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
            <path d="M12 2C6.477 2 2 6.03 2 11c0 2.685 1.326 5.074 3.407 6.696-.134.785-.49 2.875-.544 3.23-.092.6.21.614.475.438.25-.166 3.013-2.052 3.659-2.483.953.256 1.956.391 3 .391 5.523 0 10-4.03 10-9s-4.477-9-10-9zm2.466 11.235h-3.32v-1.043l2.09-2.584H11.56v-1.222h3.22v.975l-2.09 2.585h2.15v1.289h-.374z" />
          </svg>
        </a>

        {isLoginModalOpen && (
          <Suspense fallback={null}>
            <LoginModal onClose={() => setLoginModalOpen(false)} />
          </Suspense>
        )}
      </div>
    </AppContext.Provider>
  );
};

export default App;
