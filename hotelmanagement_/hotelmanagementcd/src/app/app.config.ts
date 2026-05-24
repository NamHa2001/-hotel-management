import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor'; // ✅ FIX Bug#23: Import interceptor gắn Bearer token

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    
    // Sử dụng cơ chế Change Detection mặc định (Zone.js) để tự động cập nhật số liệu lên Card
    provideRouter(routes), 
    
    // Loại bỏ Hydration để tránh xung đột trạng thái cũ (0đ) khi F5 trang báo cáo
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])), // ✅ FIX Bug#23: Đăng ký interceptor tự động gắn JWT
    
    {
      provide: "API_URL",
      useValue: '/api/User'
    },
    
    provideCharts(withDefaultRegisterables())
  ]
};