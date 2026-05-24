import { Routes } from '@angular/router';
import { LoginApp } from './login.app/login.app';
import { AdminComponent } from './admin/admin';
import { Dashboard } from './admin/dashboard/dashboard';
import { Rooms } from './admin/rooms/rooms';
import { RoomDetailComponent } from './components/room-detail/room-detail';
import { ServiceManagement } from './admin/service-management/service-management';
import { CheckoutComponent } from './admin/checkout/checkout';
import { RevenueReport } from './admin/revenue-report/revenue-report';
import { InvoiceHistory } from './admin/invoice-history/invoice-history';
import { CustomerManagement } from './admin/customer-management/customer-management';
import { BookingManagement } from './admin/booking/booking';
import { Layout as UserLayout } from './user/layout/layout';
import { Dashboard as UserDashboard } from './user/dashboard/dashboard';
import { UserRooms } from './user/user-rooms/user-rooms';
import { RoomDetailComponent as UserRoomDetail } from './user/room-detail/room-detail';
import { authGuard } from './auth.guard'; // ✅ FIX Bug#24: Import AuthGuard bảo vệ route Admin
export const routes: Routes = [
  // 1. Điều hướng mặc định khi mở app
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // 2. Trang Login riêng biệt
  { path: 'login', component: LoginApp },

  // 3. Cụm Route dành cho Admin (Layout Parent) — ✅ FIX Bug#24: Bảo vệ bằng AuthGuard
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard], // ✅ FIX Bug#24: Chỉ cho phép vào khi đã đăng nhập
    children: [
      // Mặc định khi vào /admin sẽ tự chuyển sang dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      // Trang Tổng quan
      { path: 'dashboard', component: Dashboard },

      // Quản lý phòng & Chi tiết
      { path: 'rooms', component: Rooms },
      { path: 'room-detail/:id', component: RoomDetailComponent },

      // Tài chính & Thanh toán
      { path: 'checkout', component: CheckoutComponent },
      
      // Lịch sử hóa đơn
      { path: 'invoice-history', component: InvoiceHistory },

      // Quản lý Dịch vụ
      { path: 'service', component: ServiceManagement },
      { path: 'services', component: ServiceManagement },

      // Quản lý khách hàng
      { path: 'customers', component: CustomerManagement },

      // Báo cáo doanh thu chuyên sâu (Đưa lên trên các placeholder để ưu tiên khởi tạo)
      { path: 'reports', component: RevenueReport },

      // Quản lý đặt phòng
      { path: 'booking', component: BookingManagement },
      { path: 'booking-list', component: BookingManagement },
    ]
  },
// 3.5 Cụm Route dành cho Người dùng (User Interface)
  {
    path: 'user',
    component: UserLayout, // Sử dụng Master Layout người dùng vừa thiết kế
    children: [
      // Mặc định khi vào /user sẽ chuyển sang dashboard người dùng
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: UserDashboard },
      
      // Các trang đang phát triển cho người dùng
      { path: 'rooms', component: UserRooms },
      { path: 'services', component: UserRooms }, // ✅ FIX Bug#17: Trỏ đúng sang UserRooms thay vì UserDashboard
      { path: 'room-detail/:id', component: UserRoomDetail }
    ]
  },
  // 4. Xử lý lỗi gõ sai đường dẫn
  { path: '**', redirectTo: 'login' }
];