import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // Thư viện để đọc tham số QueryParams
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Service } from '../../service'; 
import { Room, Booking } from '../rooms/room.model'; 
import { Invoice } from './invoice.model';
import { InvoiceService } from '../../invoice.service';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class CheckoutComponent implements OnInit {
  occupiedRooms: Room[] = [];
  selectedRoom: Room | null = null;
  availableServices: any[] = [];
  note: string = '';
  showBillModal: boolean = false;
  currentBill: any = null;
  // Chú thích: Hàm tính số đêm lưu trú thực tế (ít nhất là 1 đêm)
  /** 
   * Hàm tính số đêm lưu trú (Báo cáo: Dùng để xác định thời gian khách ở thực tế)
   * Chú thích: Ép kiểu dữ liệu về any để xử lý cả string và Date từ API.
   */
  calculateNights(checkIn: any, checkOut: any): number {
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    
    // Tính toán số đêm (Lấy hiệu số miligiây chia cho số miligiây trong 1 ngày)
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // Nếu khách check-out trong ngày, vẫn tính là 1 đêm theo quy định khách sạn
    return diff > 0 ? diff : 1;
  }
  discount: number = 0;
  guestAmount: number = 0;
  changeAmount: number = 0;
  paymentMethod: string = 'Tiền mặt';

  constructor(
    private hotelService: Service,
    private invoiceService: InvoiceService,
    private route: ActivatedRoute, // Thêm vào đây
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.route.queryParams.subscribe(params => {
        const roomNum = params['room'] || null;
        this.loadOccupiedRooms(roomNum);
      });
    }
  }

  loadOccupiedRooms(autoSelectRoom: string | null = null): void {
    this.hotelService.getRooms().subscribe({
      next: (data: Room[]) => {
        this.occupiedRooms = data.filter(r => {
          const status = r.roomStatus?.toLowerCase();
          return status === 'occupied' || status === 'đang ở';
        });
        this.cdr.detectChanges();

        // Auto-select sau khi dữ liệu đã về — không dùng setTimeout magic number
        if (autoSelectRoom) {
          const targetRoom = this.occupiedRooms.find(r => r.roomNumber === autoSelectRoom);
          if (targetRoom) {
            this.onCheckRoom(targetRoom);
          }
        }
      },
      error: (err) => console.error('Lỗi tải danh sách checkout:', err)
    });
  }

  // ✅ FIX Bug#3: Tìm booking đang active (checkOutTime == null) thay vì luôn lấy phần tử cuối.
  // Nếu không tìm được active booking thì fallback về phần tử cuối (tránh crash).
  private getCurrentBooking(room: Room): Booking | null {
    if (!room || !room.bookings || room.bookings.length === 0) return null;
    const active = room.bookings.slice().reverse().find((b: any) => !b.checkOutTime && !b.CheckOutTime);
    return (active ?? room.bookings[room.bookings.length - 1]) as Booking;
  }

  // Chú thích: Kiểm tra trạng thái phòng để áp dụng màu sắc Badge hiện đại (SaaS Style)
  isRoomInspected(room: Room): boolean {
    const currentBooking = this.getCurrentBooking(room);
    return (currentBooking as any)?.isInspected === true || (currentBooking as any)?.IsInspected === true;
  }

  // Chú thích: Khởi tạo quy trình kiểm phòng và tải danh sách dịch vụ từ API
  onCheckRoom(room: Room): void {
    const currentBooking = this.getCurrentBooking(room);
    if (!currentBooking) {
      alert('Phòng này hiện chưa có thông tin đặt phòng!');
      return;
    }

    this.note = (currentBooking as any)?.inspectionNote || (currentBooking as any)?.InspectionNote || '';

    this.hotelService.getServices().subscribe({
      next: (data) => {
        this.availableServices = data.map((s: any) => ({
          serviceID: s.serviceID || s.ServiceID,
          serviceName: s.serviceName || s.ServiceName,
          price: s.price || s.Price,
          quantity: 0 
        }));
        this.selectedRoom = room; 
        // Báo cáo: Cập nhật giao diện ngay lập tức khi Modal được mở
        this.cdr.detectChanges();
      }
    });
  }

  updateQuantity(service: any, change: number): void {
    if (service.quantity + change >= 0) {
      service.quantity += change;
      this.cdr.detectChanges();
    }
  }

  onSaveInspection(): void {
    const currentBooking = this.selectedRoom ? this.getCurrentBooking(this.selectedRoom) : null;
    if (!currentBooking) return;

    const usedServices = this.availableServices.filter(s => s.quantity > 0);

    // Bước 1: Lưu ghi chú
    this.hotelService.markInspected(currentBooking.bookingID, this.note).subscribe({
      next: () => {
        if (usedServices.length > 0) {
          // CHÚ Ý: Chuyển sang PascalCase để khớp với OderRequest ở Backend
          const requests = usedServices.map(item => 
            this.hotelService.addBookingService({
              BookingID: currentBooking.bookingID,
              ServiceID: item.serviceID,
              Quantity: item.quantity
            })
          );

          forkJoin(requests).subscribe({
            next: (results) => {
              console.log('Đã lưu dịch vụ:', results);
              alert(`Lưu thành công thông tin phòng ${this.selectedRoom?.roomNumber}!`);
              this.finishAction();
            },
            error: (err) => {
              console.error('Lỗi lưu dịch vụ:', err);
              alert('Ghi chú đã lưu nhưng lỗi lưu dịch vụ. Kiểm tra Network F12.');
            }
          });
        } else {
          alert(`Đã lưu ghi chú cho phòng ${this.selectedRoom?.roomNumber}!`);
          this.finishAction();
        }
      },
      error: (err) => {
        console.error('Lỗi lưu MarkInspected:', err);
        alert('Không thể lưu ghi chú. Kiểm tra kết nối!');
      }
    });
  }

  private finishAction(): void {
    this.selectedRoom = null;
    this.loadOccupiedRooms();
    this.cdr.detectChanges();
  }

  onFinalCheckOut(room: Room): void {
    const currentBooking = this.getCurrentBooking(room);
    if (!currentBooking) return;

    this.hotelService.getUsedServices(currentBooking.bookingID).subscribe({
      next: (data: any[]) => {
        const checkOutTime = new Date().toISOString();
        const nights = this.calculateNights(currentBooking.checkInTime, checkOutTime);
        
        // Cấu trúc đối tượng hóa đơn tạm thời
        this.currentBill = {
          roomNumber: room.roomNumber,
          customerName: currentBooking.customer?.fullName || (currentBooking as any)?.Customer?.FullName,
          checkInTime: currentBooking.checkInTime,
          checkOutTime: checkOutTime,
          nights: nights,
          pricePerNight: room.roomType?.pricePerNight || 0,
          roomPrice: (room.roomType?.pricePerNight || 0) * nights,
          services: data.map(s => ({
            serviceName: s.serviceName || s.ServiceName,
            price: s.price || s.Price,
            quantity: s.quantity || s.Quantity
          })),
          note: (currentBooking as any)?.inspectionNote || (currentBooking as any)?.InspectionNote || '',
          bookingID: currentBooking.bookingID
        };

        this.discount = 0;
        this.guestAmount = 0;
        
        // FIX NG0100: Sử dụng setTimeout để tách chu kỳ hiển thị Modal
        setTimeout(() => {
          this.showBillModal = true;
          this.calculateChange();
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        console.error('Lỗi lấy đồ từ SQL:', err);
        alert('Không thể tải danh sách đồ đã lưu!');
      }
    });
  }

  getServiceTotal(): number {
    if (!this.currentBill) return 0;
    return this.currentBill.services.reduce((total: number, s: any) => total + (s.price * s.quantity), 0);
  }

  getTotalPrice(): number {
    if (!this.currentBill) return 0;
    return this.currentBill.roomPrice + this.getServiceTotal();
  }

  /** 
   * Tính toán tổng cộng cuối cùng (Báo cáo: Tổng tiền sau khi trừ chiết khấu và cộng thuế)
   */
  getFinalTotal(): number {
    const totalPrice = this.getTotalPrice();
    const afterDiscount = totalPrice - (this.discount || 0);
    
    // Thuế VAT 10% tính trên số tiền sau khi đã giảm giá
    const totalWithTax = afterDiscount * 1.1;
    
    return totalWithTax > 0 ? Math.round(totalWithTax) : 0;
  }

  calculateChange(): void {
    const finalTotal = this.getFinalTotal();
    this.changeAmount = this.guestAmount > finalTotal ? this.guestAmount - finalTotal : 0;
    this.cdr.detectChanges();
  }

  confirmPayment(): void {
    if (!this.currentBill) return;

    const finalPrice = Math.round(this.getFinalTotal());

    // Chú thích báo cáo: Chuẩn hóa Schema dữ liệu theo định dạng camelCase để đảm bảo tính tương thích với Model Binder của ASP.NET Core API.
    const totalPrice = this.getTotalPrice();
    // Tính toán % giảm giá thực tế từ số tiền giảm (discount) để lưu vào DB
    const calculatedDiscountPercent = totalPrice > 0 ? (this.discount / totalPrice) * 100 : 0;

    const invoiceData: any = {
      bookingID: Number(this.currentBill.bookingID),
      invoiceDate: new Date().toISOString(),
      roomSubTotal: Number(this.currentBill.roomPrice),
      serviceSubTotal: Number(this.getServiceTotal()),
      discountPercentage: Number(calculatedDiscountPercent.toFixed(2)), // Lưu % giảm giá
      taxPercentage: 10,
      totalAmount: Number(finalPrice),
      paymentMethod: this.paymentMethod,
      staffName: this.hotelService.getUserInfo()?.fullName || this.hotelService.getUserInfo()?.userName || 'Admin'
    };

    // Thực thi lệnh lưu hóa đơn xuống Database
    this.invoiceService.processCheckOut(invoiceData.bookingID, invoiceData).subscribe({
      next: (res: any) => {
        // Đóng Modal ngay lập tức
        this.showBillModal = false;
        this.cdr.detectChanges();

        // Sử dụng nhịp trễ 300ms để ổn định luồng xử lý giao diện
        setTimeout(() => {
          this.hotelService.triggerRefreshRooms();
          this.loadOccupiedRooms();
          alert(`Thanh toán và lưu hóa đơn số #${res.invoiceId} thành công!`);
        }, 300);    
      },
      error: (err) => {
        console.error('Lỗi thanh toán:', err);
        alert('Hệ thống không thể ghi nhận hóa đơn. Vui lòng kiểm tra lại SQL!');
      }
    });
  }
}