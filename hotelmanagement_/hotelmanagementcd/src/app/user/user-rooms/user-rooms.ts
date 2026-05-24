import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Service } from '../../service';
import { RouterModule, ActivatedRoute } from '@angular/router'; // ✅ FIX: Đọc query params từ dashboard search

@Component({
  selector: 'app-user-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-rooms.html',
  styleUrl: './user-rooms.css'
})
export class UserRooms implements OnInit {
  // Chú thích báo cáo: Quản lý danh sách phòng và bộ lọc phía người dùng, tự động đồng bộ dữ liệu từ Database thông qua Service.
  allRooms: any[] = [];
  filteredRooms: any[] = [];
  roomTypes: any[] = [];

  // Các biến phục vụ bộ lọc
  filterType: string = '';
  filterPrice: number = 10000000;

  constructor(
    @Inject(Service) private hotelService: Service,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute // ✅ FIX Bug#13/18: Nhận query params từ dashboard search
  ) {}

  ngOnInit(): void {
    // ✅ FIX: Đọc query param 'type' từ dashboard search nếu có
    const typeParam = this.route.snapshot.queryParamMap.get('type');
    if (typeParam) {
      this.filterType = typeParam;
    }
    this.loadData();
  }

  loadData() {
    this.hotelService.getRoomTypes().subscribe(types => {
      this.roomTypes = types;

      this.hotelService.getRooms().subscribe(rooms => {
        rooms.forEach(room => {
          room.roomType = this.roomTypes.find(t =>
            String(t.roomTypeID) === String(room.roomTypeID)
          );
        });

        this.allRooms = rooms;
        this.applyFilter();
        this.cdr.detectChanges();
      });
    });
  }

  applyFilter() {
    this.filteredRooms = this.allRooms.filter(room => {
      const type = (room.roomType?.typeName || '').toString().toLowerCase();
      const selected = (this.filterType || '').toString().toLowerCase();
      const price = room.roomType?.pricePerNight || 0;

      const matchType = selected ? type.includes(selected) : true;
      const matchPrice = price <= this.filterPrice;

      return matchType && matchPrice;
    });
  }

  /**
   * Chú thích báo cáo: Hàm trả về hình ảnh minh họa phù hợp cho từng loại phòng khách sạn.
   * Giúp giao diện sinh động và phản ánh đúng thực tế các hạng phòng trong Database.
   */
  getRoomImage(typeName: string): string {
    const type = typeName?.toLowerCase() || '';
    if (type.includes('suite')) {
      return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2000'; // Ảnh phòng Suite sang trọng
    } else if (type.includes('deluxe')) {
      return 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=2000'; // Ảnh phòng Deluxe hiện đại
    } else if (type.includes('president')) {
      return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2000'; // Ảnh phòng Tổng thống cao cấp
    }
    return 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2000'; // Ảnh mặc định cho các phòng khác
  }
}
