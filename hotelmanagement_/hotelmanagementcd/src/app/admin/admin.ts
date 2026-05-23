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
      const userData = localStorage.getItem('userToken');
      
      if (!userData) {
        this.handleAuthError();
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser && typeof parsedUser === 'object') {
          this.currentUser = parsedUser;
          // Buộc Angular render lại ngay lập tức khi có dữ liệu người dùng
          this.cdr.detectChanges();
        } else {
          this.handleAuthError();
        }
      } catch (e) {
        console.error('Lỗi phân giải dữ liệu người dùng:', e);
        this.handleAuthError();
      }
    }
    // Ở môi trường SSR (Server), currentUser giữ nguyên là null để hiện Loader
  }

  private handleAuthError(): void {
    if (this.isBrowser) {
      localStorage.removeItem('userToken');
      this.router.navigate(['/login']);
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