import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Service } from '../../service';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './room-detail.html',
  styleUrl: './room-detail.css'
})
export class RoomDetailComponent implements OnInit {
  // Chú thích báo cáo: Thành phần xử lý hiển thị chi tiết hạng phòng và thu thập thông tin đặt phòng từ phía khách hàng.
  room: any = null;
  roomId: any = 0;

  // Đối tượng lưu trữ thông tin đặt phòng
  bookingData = {
    customerName: '',
    phoneNumber: '',
    checkInDate: '',
    checkOutDate: '',
    note: ''
  };

  constructor(
    private route: ActivatedRoute,
    @Inject(Service) private hotelService: Service,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.roomId = (idParam && idParam !== 'undefined') ? idParam : 0;
    console.log('ID từ URL:', this.roomId);
    this.loadRoomDetail();
  }

 // ✅ FIX Bug#20: Gọi trực tiếp getRoomById thay vì tải toàn bộ danh sách phòng
  loadRoomDetail() {
    const id = Number(this.roomId);
    if (!id || id <= 0) {
      this.room = { roomID: -1 };
      this.cdr.detectChanges();
      return;
    }

    this.hotelService.getRoomById(id).subscribe({
      next: (foundRoom: any) => {
        // Backend trả về room kèm roomType (ThenInclude) — dùng trực tiếp
        this.room = {
          ...foundRoom,
          roomID: foundRoom.roomID || foundRoom.roomId
        };
        this.cdr.detectChanges();
      },
      error: () => {
        this.room = { roomID: -1 };
        this.cdr.detectChanges();
      }
    });
  }


  onBooking() {
    if (!this.bookingData.customerName || !this.bookingData.phoneNumber || !this.bookingData.checkInDate) {
      alert('Vui lòng nhập đầy đủ họ tên, số điện thoại và ngày đến!');
      return;
    }

    // Tìm khách hàng theo số điện thoại, nếu chưa có thì tạo mới
    this.hotelService.searchCustomer({ phoneNumber: this.bookingData.phoneNumber }).subscribe({
      next: (customers: any[]) => {
        if (customers && customers.length > 0) {
          this.submitBooking(customers[0].customerID);
        } else {
          this.createCustomerAndBook();
        }
      },
      error: () => {
        // Nếu API trả về 404 (không tìm thấy) thì tạo khách mới
        this.createCustomerAndBook();
      }
    });
  }

  private createCustomerAndBook() {
    const newCustomer: any = {
      fullName: this.bookingData.customerName,
      phoneNumber: this.bookingData.phoneNumber,
      identityCard: null  // ✅ FIX Bug#4: Gửi null thay vì "" để tránh lỗi "CCCD đã tồn tại" cho khách thứ 2 trở đi
    };
    this.hotelService.addCustomer(newCustomer).subscribe({
      next: (created: any) => {
        this.submitBooking(created.customerID);
      },
      error: () => {
        alert('Không thể tạo thông tin khách hàng. Vui lòng thử lại!');
      }
    });
  }

  /**
   * ✅ FIX Bug E: Trả về ảnh minh họa phù hợp theo loại phòng (thay vì hardcode 1 ảnh)
   * Dùng cùng logic với user-rooms để đồng nhất trải nghiệm.
   */
  getRoomImage(typeName: string | undefined): string {
    const type = (typeName || '').toLowerCase();
    if (type.includes('president')) {
      return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2000';
    } else if (type.includes('suite')) {
      return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2000';
    } else if (type.includes('deluxe')) {
      return 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=2000';
    }
    return 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=2000';
  }

  /**
   * ✅ FIX Bug F: Trả về danh sách tiện nghi theo loại phòng (thay vì hardcode)
   * DB không có cột amenities nên dùng typeName để suy ra.
   */
  getAmenities(typeName: string | undefined): { icon: string; label: string }[] {
    const type = (typeName || '').toLowerCase();
    if (type.includes('president')) {
      return [
        { icon: 'fa-expand',    label: '80m²' },
        { icon: 'fa-bed',       label: 'Giường King' },
        { icon: 'fa-wifi',      label: 'Wifi miễn phí' },
        { icon: 'fa-snowflake', label: 'Điều hòa' },
        { icon: 'fa-bath',      label: 'Bồn tắm Jacuzzi' },
        { icon: 'fa-mug-hot',   label: 'Bữa sáng VIP' }
      ];
    } else if (type.includes('suite')) {
      return [
        { icon: 'fa-expand',    label: '60m²' },
        { icon: 'fa-bed',       label: 'Giường King' },
        { icon: 'fa-wifi',      label: 'Wifi miễn phí' },
        { icon: 'fa-snowflake', label: 'Điều hòa' },
        { icon: 'fa-bath',      label: 'Bồn tắm đứng' },
        { icon: 'fa-mug-hot',   label: 'Bữa sáng' }
      ];
    } else if (type.includes('deluxe')) {
      return [
        { icon: 'fa-expand',    label: '45m²' },
        { icon: 'fa-bed',       label: 'Giường King' },
        { icon: 'fa-wifi',      label: 'Wifi miễn phí' },
        { icon: 'fa-snowflake', label: 'Điều hòa' },
        { icon: 'fa-bath',      label: 'Bồn tắm' },
        { icon: 'fa-mug-hot',   label: 'Bữa sáng' }
      ];
    }
    // Standard / mặc định
    return [
      { icon: 'fa-expand',    label: '30m²' },
      { icon: 'fa-bed',       label: 'Giường đôi' },
      { icon: 'fa-wifi',      label: 'Wifi miễn phí' },
      { icon: 'fa-snowflake', label: 'Điều hòa' },
      { icon: 'fa-tv',        label: 'TV màn hình phẳng' },
      { icon: 'fa-mug-hot',   label: 'Minibar' }
    ];
  }

  private submitBooking(customerID: number) {
    const booking = {
      roomID: this.room.roomID,
      customerID: customerID,
      checkInTime: new Date(this.bookingData.checkInDate).toISOString(),
      checkOutTime: this.bookingData.checkOutDate ? new Date(this.bookingData.checkOutDate).toISOString() : null,
      roomStatus: 'Occupied',
      totalRoomPrice: this.room.roomType?.pricePerNight || 0
    };
    this.hotelService.createBooking(booking).subscribe({
      next: () => {
        alert('Đặt phòng thành công! Cảm ơn bạn đã tin tưởng NAMHA Hotel. Chúng tôi sẽ liên hệ xác nhận qua số ' + this.bookingData.phoneNumber);
        this.bookingData = { customerName: '', phoneNumber: '', checkInDate: '', checkOutDate: '', note: '' };
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Lỗi không xác định';
        alert('Đặt phòng thất bại: ' + msg);
      }
    });
  }
}