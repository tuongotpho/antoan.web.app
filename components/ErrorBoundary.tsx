import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    // Tải lại hẳn trang, không chỉ xoá trạng thái lỗi.
    //
    // Chỉ đặt lại trạng thái thì React dựng lại đúng thành phần vừa hỏng, với
    // nguyên nhân y như cũ — bấm "Thử lại" mười lần vẫn ra màn hình lỗi. Lỗi
    // hay gặp nhất ở đây là thiếu mảnh mã sau khi deploy bản mới, mà cái đó chỉ
    // tải lại trang mới chữa được.
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã xảy ra lỗi</h2>
            <p className="text-gray-600 mb-6">
              Trang này đã gặp sự cố. Vui lòng thử tải lại hoặc quay về trang chủ.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Chi tiết lỗi
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs text-red-600 overflow-x-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Thử lại
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Trang chủ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
