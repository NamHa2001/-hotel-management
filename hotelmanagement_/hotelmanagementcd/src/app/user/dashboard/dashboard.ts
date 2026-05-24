import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // ✅ FIX Bug#13

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  checkInDate: string = '';
  checkOutDate: string = '';
  selectedRoomType: string = '';

  constructor(private router: Router) {} // ✅ FIX Bug#13

  // ✅ FIX Bug#13: Điều hướng sang trang danh sách phòng với bộ lọc từ form tìm kiếm
  searchRooms(): void {
    this.router.navigate(['/user/rooms'], {
      queryParams: {
        type: this.selectedRoomType || null,
        checkIn: this.checkInDate || null,
        checkOut: this.checkOutDate || null
      }
    });
  }
}
