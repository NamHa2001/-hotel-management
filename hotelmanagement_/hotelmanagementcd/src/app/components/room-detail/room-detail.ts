import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common'; 
// 1. Sửa tên class import từ HotelService thành Service cho khớp với file service.ts của bạn
import { Service } from '../../service'; 
import { Room } from '../../admin/rooms/room.model';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-detail.html', 
  styleUrl: './room-detail.css' 
})
export class RoomDetailComponent implements OnInit {
  roomId!: number;
  roomData?: Room;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    // 2. Sửa kiểu dữ liệu ở đây thành Service
    private hotelService: Service 
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.roomId = Number(idParam);
    
    if (this.roomId) {
      this.loadRoomDetail();
    }
  }

  // ✅ FIX Bug#20 (admin side): Gọi trực tiếp getRoomById thay vì tải toàn bộ danh sách rồi filter
  loadRoomDetail() {
    this.isLoading = true;
    this.hotelService.getRoomById(this.roomId).subscribe({
      next: (room: Room) => {
        this.roomData = room;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Lỗi tải chi tiết phòng:', err);
        this.isLoading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/admin/rooms']); 
  }
}