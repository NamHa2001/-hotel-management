import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * ✅ FIX Bug#24: AuthGuard bảo vệ các route yêu cầu đăng nhập
 * Kiểm tra token trong localStorage trước khi cho phép điều hướng.
 * Nếu không có token hợp lệ → chuyển hướng về trang /login.
 */
export const authGuard: CanActivateFn = (_route, _state) => {
  const router = inject(Router);

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('userToken');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.token) {
          return true; // Đã đăng nhập — cho phép tiếp tục
        }
      }
    } catch {
      // Token bị lỗi parse → xem như chưa đăng nhập
    }
  }

  // Chưa đăng nhập → chuyển về trang Login
  router.navigate(['/login']);
  return false;
};
