import { HttpInterceptorFn } from '@angular/common/http';

/**
 * ✅ FIX Bug#23: HTTP Interceptor tự động gắn JWT Bearer token vào mọi request
 * Đọc token từ localStorage (key: 'userToken', dạng JSON với field 'token')
 * và thêm header: Authorization: Bearer <token>
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('userToken');
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed?.token;
        if (token) {
          const cloned = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          return next(cloned);
        }
      }
    } catch {
      // Nếu JSON parse lỗi thì bỏ qua — gửi request bình thường
    }
  }
  return next(req);
};
