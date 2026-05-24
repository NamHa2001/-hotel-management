import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Bổ sung để dùng ngModel cho form Sửa
import { Service } from '../../service';
import { Room, RoomType,Customer } from './room.model';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators'; // ✅ FIX Bug#20
@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule], // Thêm FormsModule ở đây
  templateUrl: './rooms.html',
  styleUrl: './rooms.css',
})
export class Rooms implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>(); // ✅ FIX Bug#20
  roomsList: Room[] = [];
  roomTypes: RoomType[] = []; // Danh sách loại phòng để chọn khi Sửa

  // --- Biến lưu phòng đang được chọn ---
  selectedRoom: Room | null = null;
  
  // Trạng thái điều khiển Modal: đang xem chi tiết hay đang sửa thông tin
  isEditMode: boolean = false;
  
  // 1. Biến để phân biệt đang Thêm hay đang Sửa
  isAddMode: boolean = false;

  constructor(
    private hotelService: Service, // Service của bạn đã có sẵn
    private router: Router,
    private cdr: ChangeDetectorRef, 
    @Inject(PLATFORM_ID) private platformId: Object 
  ) {}

  ngOnInit(): void {
    // Đảm bảo dữ liệu luôn được gọi khi Component khởi tạo
    this.refreshData();
    // Chú thích báo cáo: Đăng ký lắng nghe tín hiệu làm mới từ Service.
    // Khi trang Checkout báo đã thanh toán, trang này sẽ tự động chạy lại hàm loadRooms.
    // ✅ FIX Bug#20: Dùng takeUntil để unsubscribe khi component bị destroy (tránh memory leak)
    this.hotelService.refreshRooms$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('Nhận tín hiệu làm mới từ hệ thống...');
        this.loadRooms();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Tạo một hàm tổng hợp để làm mới toàn bộ dữ liệu trang
  refreshData() {
    this.loadRooms();
    this.loadRoomTypes();
    console.log('Hệ thống đang tải lại sơ đồ phòng...');
  }

  loadRooms() {
    this.hotelService.getRooms().subscribe({
      next: (data: Room[]) => {
        // Cập nhật danh sách phòng
        this.roomsList = [...data]; 
        // Thông báo cho Angular biết dữ liệu đã thay đổi để vẽ lại giao diện
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi tải sơ đồ phòng:', err);
      }
    });
  }

  loadRoomTypes() {
    // Lưu ý: Đảm bảo bạn đã viết hàm getRoomTypes() trong service.ts
    this.hotelService.getRoomTypes().subscribe({
      next: (data) => { this.roomTypes = data; },
      error: (err) => console.error('Lỗi tải loại phòng:', err)
    });
  }

  // ✅ FIX Bug#3: Helper lấy booking đang active (checkOutTime == null).
  // Fallback về phần tử cuối để tránh crash nếu không tìm được active booking.
  // Public vì được gọi từ template HTML.
  getActiveBooking(room: Room): any | null {
    if (!room?.bookings || room.bookings.length === 0) return null;
    const active = room.bookings.slice().reverse().find((b: any) => !b.checkOutTime && !b.CheckOutTime);
    return active ?? room.bookings[room.bookings.length - 1];
  }

  // --- Hàm xử lý khi nhấn vào phòng ---
  onRoomClick(room: Room): void {
    this.selectedRoom = { ...room }; // Dùng spread operator để tạo bản sao, tránh sửa trực tiếp vào danh sách gốc khi chưa lưu
    this.isEditMode = false; // Reset về chế độ xem chi tiết
    this.isAddMode = false;
    console.log('Bạn đã chọn phòng số:', room.roomNumber);

    if (this.checkStatus(room.roomStatus, 'occupied')) {
      if (room.bookings && room.bookings.length > 0) {
        const currentBooking = this.getActiveBooking(room); // ✅ FIX Bug#3
        console.log('Thông tin khách hàng:', currentBooking?.customer?.fullName);
      } else {
        console.log('Phòng báo bận nhưng chưa có dữ liệu Booking.');
      }
    }
  }

  // --- HÀM KIỂM TRA TRẠNG THÁI ---
  checkStatus(status: string | undefined, target: string): boolean {
    if (!status) return false;
    const s = status.toLowerCase();
    const t = target.toLowerCase();
    if (t === 'available') return s === 'available' || s === 'trống';
    return s === t;
  }

  // --- HÀM TÍNH TOÁN SỐ LƯỢNG ---
  get countAll() { return this.roomsList?.length || 0; }
  get countAvailable() { return this.roomsList?.filter(r => this.checkStatus(r.roomStatus, 'available')).length || 0; }
  get countOccupied() { return this.roomsList?.filter(r => this.checkStatus(r.roomStatus, 'occupied')).length || 0; }
  get countCleaning() { return this.roomsList?.filter(r => this.checkStatus(r.roomStatus, 'cleaning')).length || 0; }

  // Tính tỷ lệ lấp đầy (Báo cáo: Phần trăm phòng đang có khách)
  get occupancyRate() {
    if (this.countAll === 0) return 0;
    const rate = (this.countOccupied / this.countAll) * 100;
    return Math.round(rate);
  }

  
  // --- HÀM XỬ LÝ MÀU SẮC PHONG CÁCH LIGHT HERITAGE ---
  getStatusClass(status: string | undefined): string {
  if (!status) return 'available';
  const s = status.toLowerCase();

  const statusMap: any = {
    'available': 'available',
    'trống': 'available',
    'occupied': 'occupied',
    'đang ở': 'occupied',
    'cleaning': 'cleaning',
    'cần dọn': 'cleaning',
    'repairing': 'repairing',
    'bảo trì': 'repairing'
  };

  return statusMap[s] || 'available';
}

  // --- CHỨC NĂNG XÓA ---
  onDeleteRoom(id: number | undefined): void {
    if (!id) return;
    if (confirm('Bạn có chắc chắn muốn xóa phòng này không?')) {
      this.hotelService.deleteRoom(id).subscribe({
        next: () => {
          alert('Xóa phòng thành công!');
          this.selectedRoom = null;
          this.loadRooms();
        },
        error: (err) => {
          console.error('Lỗi khi xóa:', err);
          alert(err.error?.message || 'Không thể xóa phòng này!');
        }
      });
    }
  }

  // --- CHỨC NĂNG CẬP NHẬT (UPDATE) & THÊM MỚI (ADD) ---

  // Bật chế độ sửa
  onEditClick() {
    this.isEditMode = true;
    this.isAddMode = false;
  }

  // Hủy bỏ việc sửa
  onCancelEdit() {
    this.isEditMode = false;
    this.isAddMode = false;
    this.selectedRoom = null;
  }

  // Hàm trung gian để quyết định Thêm hay Sửa (Sẽ gọi từ nút Lưu trên HTML)
  onSaveRoom() {
    if (!this.selectedRoom) return;

    if (this.isAddMode) {
      // Gọi API thêm mới
      this.hotelService.addRoom(this.selectedRoom).subscribe({
        next: () => {
          alert('Thêm phòng mới thành công!');
          this.finishAction();
        },
        error: (err) => {
          console.error('Lỗi khi thêm:', err);
          alert('Có lỗi xảy ra khi thêm phòng mới!');
        }
      });
    } else {
      // Gọi hàm cập nhật hiện có
      this.onSaveUpdate();
    }
  }

  // Lưu dữ liệu cập nhật xuống Backend
  onSaveUpdate() {
    if (this.selectedRoom && this.selectedRoom.roomID) {
      this.hotelService.updateRoom(this.selectedRoom.roomID, this.selectedRoom).subscribe({
        next: () => {
          alert('Cập nhật thông tin phòng thành công!');
          this.finishAction();
        },
        error: (err) => {
          console.error('Lỗi cập nhật:', err);
          alert('Có lỗi xảy ra khi cập nhật phòng!');
        }
      });
    }
  }

  // Hàm hỗ trợ dọn dẹp sau khi Thêm/Sửa xong
  /** 
   * Hàm kết thúc tác vụ (Thêm/Sửa/Xóa)
   * Nhiệm vụ: Reset trạng thái giao diện, đóng Modal và đồng bộ lại dữ liệu mới nhất từ Server.
   */
  private finishAction() {
    this.isEditMode = false;
    this.isAddMode = false;
    this.selectedRoom = null;
    this.refreshData(); // Gọi lại hàm refresh để đảm bảo dữ liệu mới nhất


  }

  // Chức năng mở Modal để thêm phòng
  openAddRoomModal() { 
    this.isAddMode = true;
    this.isEditMode = true; 
    this.selectedRoom = {
      roomID: 0,
      roomNumber: '',
      roomStatus: 'Available',
      roomTypeID: this.roomTypes[0]?.roomTypeID || 0,
      bookings: [] // Khởi tạo mảng rỗng để tránh lỗi dữ liệu
    } as Room; 
  }

  // --- TRẠNG THÁI CHO BOOKING ---
isBookingMode: boolean = false; // Đang ở chế độ nhập thông tin đặt phòng
customerSearchQuery: string = ''; // Nội dung nhập vào để tìm khách (SĐT hoặc CCCD)
foundCustomer: Customer | null = null; // Lưu khách hàng tìm thấy từ DB
isNewCustomer: boolean = false; // Đánh dấu nếu đây là khách mới hoàn toàn
// --- TRẠNG THÁI CHO ĐỔI PHÒNG ---
  isChangingRoom: boolean = false; // Trạng thái đang chọn phòng để đổi
  availableRoomsForChange: Room[] = []; // Danh sách các phòng trống khả dụng để đổi sang

// Đối tượng để lưu dữ liệu khách hàng mới (nếu chưa có trong hệ thống)
tempCustomer: Customer = {
  customerID: 0,
  fullName: '',
  identityCard: '',
  phoneNumber: ''
};

// Đối tượng để chuẩn bị dữ liệu đặt phòng
tempBooking: any = {
  checkInTime: new Date().toISOString().slice(0, 16), // Mặc định là thời điểm hiện tại
  roomID: 0,
  customerID: 0
};

// Hàm tìm kiếm khách hàng dựa trên dữ liệu nhập vào (SĐT hoặc CCCD)
  onSearchCustomer() {
  if (!this.customerSearchQuery) {
    alert('Vui lòng nhập Số điện thoại hoặc CCCD!');
    return;
  }

  console.log('Đang tìm kiếm với từ khóa:', this.customerSearchQuery);

  this.hotelService.searchCustomer({
    identityCard: this.customerSearchQuery,
    phoneNumber: this.customerSearchQuery
  }).subscribe({
    next: (data: Customer[]) => {
      console.log('Dữ liệu API trả về:', data); // <--- LOG QUAN TRỌNG

      if (data && data.length > 0) {
        // Tìm thấy khách cũ
        this.foundCustomer = data[0];
        this.isNewCustomer = false;
        this.tempBooking.customerID = this.foundCustomer.customerID;
        console.log('Kết quả: Đã thấy khách quen', this.foundCustomer.fullName);
      } else {
        // Không tìm thấy (Khách mới)
        this.foundCustomer = null;
        this.isNewCustomer = true;
        
        // Điền sẵn thông tin đã nhập vào tempCustomer
        this.tempCustomer = {
          customerID: 0,
          fullName: '',
          // Tự động phán đoán: Nếu toàn số thì có thể là CCCD hoặc SĐT
          identityCard: this.customerSearchQuery, 
          phoneNumber: this.customerSearchQuery
        };
        console.log('Kết quả: Không tìm thấy, chuyển sang chế độ khách mới');
      }
    },
    error: (err: any) => {
      console.error('Lỗi API Search:', err);
      this.isNewCustomer = true; // Lỗi thì cũng cho nhập mới luôn
    }
  });
}

  // Hàm xử lý khi nhấn nút "Xác nhận Đặt phòng"
  onConfirmBooking() {
    // 1. Kiểm tra nếu là khách mới, phải tạo khách trước
    if (this.isNewCustomer) {
      if (!this.tempCustomer.fullName || !this.tempCustomer.phoneNumber) {
        alert('Vui lòng nhập đầy đủ Tên và Số điện thoại cho khách hàng mới!');
        return;
      }

      this.hotelService.addCustomer(this.tempCustomer).subscribe({
        next: (createdCustomer) => {
          console.log('Đã tạo khách hàng mới thành công:', createdCustomer);
          // Sau khi tạo khách xong, lấy ID vừa tạo để làm Booking
          this.executeBooking(createdCustomer.customerID);
        },
        error: (err) => alert('Lỗi khi tạo khách hàng: ' + err.error?.message)
      });
    } else {
      // 2. Nếu là khách cũ, đã có ID từ lúc Search
      if (!this.tempBooking.customerID) {
        alert('Vui lòng tìm kiếm khách hàng trước!');
        return;
      }
      this.executeBooking(this.tempBooking.customerID);
    }
  }

  // Hàm phụ để thực hiện gọi API Booking
  private executeBooking(customerId: number) {
    // ✅ FIX Bug#2: Lấy giá phòng từ roomType để hiển thị trong cột "Tổng tiền"
    // Đây là giá ước tính 1 đêm; sẽ được cập nhật chính xác sau khi checkout
    const pricePerNight = this.selectedRoom?.roomType?.pricePerNight || 0;

    const bookingData = {
      roomID: this.selectedRoom?.roomID,
      customerID: customerId,
      checkInTime: this.tempBooking.checkInTime ? new Date(this.tempBooking.checkInTime).toISOString() : new Date().toISOString(),
      roomStatus: 'Occupied',
      totalRoomPrice: pricePerNight // ✅ FIX Bug#2: Giá ước tính 1 đêm (sẽ cập nhật khi checkout)
    };

    this.hotelService.createBooking(bookingData).subscribe({
      next: (res) => {
        alert('Đặt phòng thành công!');
        this.resetBookingForm();
        this.loadRooms(); // Tải lại sơ đồ phòng để thấy màu đỏ (Occupied)
      },
      error: (err) => alert('Lỗi khi đặt phòng: ' + err.error?.message)
    });
  }

  // Hàm reset trạng thái form
  resetBookingForm() {
    this.isBookingMode = false;
    this.selectedRoom = null;
    this.foundCustomer = null;
    this.customerSearchQuery = '';
    this.isNewCustomer = false;
  }

  // Hàm xử lý khi nhấn vào "Xem chi tiết / Gọi dịch vụ"
  onViewDetail() {
    if (this.selectedRoom && this.selectedRoom.roomID) {
      // Đóng modal hiện tại trước khi chuyển trang
      const roomId = this.selectedRoom.roomID;
      this.selectedRoom = null;
      
      // Chuyển hướng sang trang chi tiết phòng
      // Lưu ý: Bạn cần đảm bảo đã định nghĩa route này trong app.routes.ts
      this.router.navigate(['/admin/room-detail', roomId]);
    }
  }

  /** 
   * Điều hướng sang trang Checkout chuyên nghiệp
   * Chú thích: Truyền số phòng qua URL để trang Checkout tự động lọc dữ liệu.
   */
  goToCheckout(room: any): void {
    if (!room) return;
    this.selectedRoom = null; // Đóng modal sơ đồ phòng trước khi chuyển trang
    
    // Điều hướng sang trang checkout kèm theo số phòng làm tham số query
    this.router.navigate(['/admin/checkout'], { queryParams: { room: room.roomNumber } });
  }

  /** 
   * Xác nhận dọn phòng xong (Báo cáo: Quy trình chuyển trạng thái phòng sau vệ sinh)
   * Chú thích: Cập nhật trạng thái từ 'Cleaning' về 'Available' để sẵn sàng đón khách mới.
   */
  /** 
   * Xác nhận dọn phòng xong (Báo cáo: Cập nhật trạng thái trực tiếp từ thẻ phòng)
   * Chú thích: Sử dụng stopPropagation để ngăn chặn việc mở Modal khi bấm nút nhanh.
   */
  onConfirmCleaned(room: any): void {
    if (!room || !room.roomID) return;
    
    // Tạo bản sao dữ liệu và chuyển trạng thái về Trống
    const updatedRoom = { ...room, roomStatus: 'Available' };
    
    this.hotelService.updateRoom(room.roomID, updatedRoom).subscribe({
      next: () => {
        console.log(`Phòng ${room.roomNumber} đã sẵn sàng.`);
        this.finishAction(); // Tự động đóng modal và load lại danh sách
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật trạng thái dọn phòng:', err);
        alert('Không thể cập nhật trạng thái phòng lúc này!');
      }
    });
  }
  // Khởi động quy trình đổi phòng
  onStartChangeRoom(currentRoom: Room) {
    this.isChangingRoom = true;
    // Lọc danh sách các phòng đang trống (Available) và không phải là phòng hiện tại
    this.availableRoomsForChange = this.roomsList.filter(r => 
      (this.checkStatus(r.roomStatus, 'available') || this.checkStatus(r.roomStatus, 'trống')) && 
      r.roomID !== currentRoom.roomID
    );
    
    if (this.availableRoomsForChange.length === 0) {
      alert('Hiện không còn phòng trống nào khác để đổi!');
      this.isChangingRoom = false;
    }
  }

  // Xác nhận đổi sang phòng mới
  onConfirmChangeRoom(newRoom: Room) {
    if (!this.selectedRoom || !newRoom.roomID) return;

    if (confirm(`Xác nhận đổi khách từ phòng ${this.selectedRoom.roomNumber} sang phòng ${newRoom.roomNumber}?`)) {
      const currentBooking = this.getActiveBooking(this.selectedRoom); // ✅ FIX Bug#3
      if (!currentBooking) return;

      // Bước 1: Cập nhật roomID trong Booking sang phòng mới
      // Chỉ gửi scalar fields, không gửi navigation objects (room/customer) để tránh EF conflict
      const updatedBooking = {
        bookingID: currentBooking.bookingID,
        roomID: newRoom.roomID,
        customerID: currentBooking.customerID,
        checkInTime: currentBooking.checkInTime,
        checkOutTime: currentBooking.checkOutTime,
        roomStatus: currentBooking.roomStatus,
        totalRoomPrice: currentBooking.totalRoomPrice,
        isInspected: currentBooking.isInspected,
        inspectionNote: currentBooking.inspectionNote
      };

      this.hotelService.updateBooking(currentBooking.bookingID, updatedBooking).subscribe({
        next: () => {
          const oldRoomID = this.selectedRoom?.roomID;

          // Bước 2: Đặt phòng cũ về Cleaning
          if (oldRoomID) {
            const oldRoomUpdate = { ...this.selectedRoom, roomStatus: 'Cleaning' };
            this.hotelService.updateRoom(oldRoomID, oldRoomUpdate).subscribe();
          }

          // Bước 3: Đặt phòng mới thành Occupied
          this.hotelService.updateRoom(newRoom.roomID!, { ...newRoom, roomStatus: 'Occupied' }).subscribe();

          alert('Đổi phòng thành công!');
          this.isChangingRoom = false;
          this.finishAction();
        },
        error: () => alert('Lỗi khi thực hiện đổi phòng! Vui lòng thử lại.')
      });
    }
  }
}