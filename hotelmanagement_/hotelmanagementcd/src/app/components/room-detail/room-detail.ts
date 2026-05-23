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

  loadRoomDetail() {
    this.isLoading = true;
    this.hotelService.getRooms().subscribe({
      // 3. Định nghĩa kiểu dữ liệu rõ ràng (Room[]) để fix lỗi "implicitly has any type"
      next: (rooms: Room[]) => {
        this.roomData = rooms.find((r: Room) => r.roomID === this.roomId);
        this.isLoading = false;
        console.log('Dữ liệu phòng hiện tại:', this.roomData);
      },
      // 4. Thêm kiểu any cho lỗi để fix lỗi "implicitly has any type"
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