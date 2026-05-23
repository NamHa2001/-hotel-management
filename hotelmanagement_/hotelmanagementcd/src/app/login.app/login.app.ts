import { Component, Inject, PLATFORM_ID } from '@angular/core'; 
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common'; 
import { Router } from '@angular/router';
import { Service } from '../service';

@Component({
  selector: 'app-login.app',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.app.html',
  styleUrl: './login.app.css',
})
export class LoginApp {
  
  user = {
    username: '',
    password: ''
  };

  constructor(
    @Inject(Service) private authService: Service, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object 
  ) {}

  onSubmit(formData: any) {
  if (isPlatformBrowser(this.platformId)) {
    console.clear(); 
    console.log('📡 Đang gửi dữ liệu đăng nhập...');

    this.authService.login(formData.username, formData.password).subscribe({
      next: (res) => {
        // Log res này cực kỳ quan trọng, bạn hãy nhìn kỹ trong F12 xem 
        // nó là 'fullname' hay 'fullName' nhé!
        console.log('✅ Dữ liệu Server trả về:', res); 

        if (res && res.token) {
          // SỬA LỖI TẠI ĐÂY:
          // Dựa trên Swagger của bạn, trường đó có thể là 'fullname' (viết thường)
          // Chúng ta kiểm tra cả 2 trường hợp cho chắc ăn
          const serverName = res.fullname || res.fullName || res.userName;

          const userData = { 
            ...res, 
            fullName: serverName || formData.username 
          };
          
          this.authService.saveUserToken(userData); 

          // Logic tính thời gian (Giữ nguyên)
          const expireTime = new Date(res.expiration).getTime();
          const currentTime = new Date().getTime();
          const timeDiff = expireTime - currentTime;

          if (timeDiff > 0) {
            console.log(`🔑 Token: ${res.token}`);
            console.log(`👤 Tên sẽ hiển thị trên Dashboard: ${userData.fullName}`);
          }

          alert('Đăng nhập thành công!!!');
          
          // Chú thích báo cáo: Thực hiện phân luồng người dùng (Role-based Routing). 
          // Nếu tài khoản có quyền Admin sẽ vào khu vực quản trị, ngược lại sẽ chuyển về giao diện người dùng.
          // Chú thích báo cáo: Chuyển đổi Role về dạng chữ thường trước khi so sánh để đảm bảo tính chính xác, 
          // tránh lỗi không chuyển hướng do sai lệch định dạng chữ hoa/thường từ API.
          const currentRole = (userData.userRole || '').toLowerCase();
          
          if (currentRole === 'admin') {
            console.log('🚀 Điều hướng tới phân hệ Quản trị');
            this.router.navigate(['/admin/dashboard']);
          } else  {
            console.log('🏠 Điều hướng tới phân hệ Người dùng');
            this.router.navigate(['/user/dashboard']);
          }
        }
      },
      error: (err) => {
        console.error('❌ Lỗi đăng nhập:', err);
        alert('Đăng nhập thất bại! Kiểm tra lại tài khoản.');
      }
    });
  }
}
}