import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  // Chú thích báo cáo: Khởi tạo các biến lưu trữ thông tin tìm kiếm phòng như ngày đến, ngày đi và loại phòng để người dùng lọc dữ liệu trực tiếp từ trang chủ.
  checkInDate: string = '';
  checkOutDate: string = '';
  selectedRoomType: string = '';
}
