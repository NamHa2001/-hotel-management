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
      this.authService.login(formData.username, formData.password).subscribe({
        next: (res) => {
          if (res && res.token) {
            // Kiểm tra cả fullname (lowercase) và fullName để tương thích với mọi phiên bản API
            const serverName = res.fullname || res.fullName || res.userName;
            const userData = {
              ...res,
              fullName: serverName || formData.username
            };

            this.authService.saveUserToken(userData);

            alert('Đăng nhập thành công!!!');

            // Chú thích báo cáo: Phân luồng theo Role — Admin vào quản trị, còn lại vào giao diện người dùng.
            // Chuyển về lowercase để tránh lỗi sai chữ hoa/thường từ API.
            // ✅ FIX Bug G: Xóa dead code timeDiff (token vừa cấp luôn hợp lệ)
            // ✅ FIX Bug J: Xóa toàn bộ console.log debug
            const currentRole = (userData.userRole || '').toLowerCase();
            if (currentRole === 'admin') {
              this.router.navigate(['/admin/dashboard']);
            } else {
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