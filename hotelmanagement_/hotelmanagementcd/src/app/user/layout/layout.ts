import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnInit, Inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { Service } from '../../service'; // Đảm bảo đường dẫn này đúng với vị trí file service.ts của bạn

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  // Chú thích báo cáo: Layout tổng quát cho người dùng, tích hợp CommonModule và RouterModule để quản lý điều hướng và các directive cơ bản.
  currentUser: any = null;

  constructor(
    @Inject(Service) private authService: Service, 
    private router: Router
  ) {}

  ngOnInit(): void {
    // Chú thích báo cáo: Lấy thông tin người dùng từ LocalStorage khi khởi tạo Layout để hiển thị tên và trạng thái đăng nhập.
    this.currentUser = this.authService.getUserInfo();
  }

  onLogout(): void {
    this.authService.logout();
  }
}
