import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  // QUAN TRỌNG: Tắt cô lập CSS để các style !important trong admin.css có thể đè lên màu trắng mặc định
  encapsulation: ViewEncapsulation.None 
})
export class AdminComponent implements OnInit {
  currentUser: any = null;
  isBrowser: boolean;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.checkAuth();
  }

  private checkAuth(): void {
    if (this.isBrowser) {
      // ✅ FIX Bug I: Redirect đã được authGuard xử lý trước khi component này khởi tạo.
      // Chỉ giữ lại việc đọc currentUser để hiển thị tên/avatar trên sidebar.
      try {
        const userData = localStorage.getItem('userToken');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          if (parsedUser && typeof parsedUser === 'object') {
            this.currentUser = parsedUser;
            this.cdr.detectChanges();
          }
        }
      } catch {
        // Token bị lỗi JSON — dọn sạch, authGuard sẽ xử lý lần sau
        localStorage.removeItem('userToken');
      }
    }
  }

  logout(): void {
    if (this.isBrowser) {
      this.currentUser = null;
      localStorage.removeItem('userToken');
      // replaceUrl: true ngăn chặn việc nhấn nút 'Back' quay lại trang admin sau khi thoát
      this.router.navigate(['/login'], { replaceUrl: true }); 
    }
  }
}