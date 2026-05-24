import { Component, OnInit, OnDestroy, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Service } from '../../service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators'; // ✅ FIX Bug#20: Import để unsubscribe khi component destroy

@Component({
  selector: 'app-booking-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.html',
  styleUrl: './booking.css'
})
export class BookingManagement implements OnInit, OnDestroy {
  // ✅ FIX Bug#20: Subject để unsubscribe mọi Observable khi component bị destroy
  private destroy$ = new Subject<void>();
  allBookings: any[] = [];
  filteredBookings: any[] = [];

  selectedBooking: any = null;
  activeTab: string = 'all';
  searchQuery: string = '';

  totalCount = 0;
  occupiedCount = 0;
  upcomingCount = 0;
  completedCount = 0;

  constructor(
    @Inject(Service) private hotelService: Service,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBookings();
    // ✅ FIX Bug#20: Dùng takeUntil để tự động unsubscribe khi component bị destroy
    this.hotelService.refreshRooms$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadBookings());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBookings(): void {
    this.hotelService.getBookings().subscribe({
      next: (bookings) => {
        this.allBookings = bookings;
        this.calcStats();
        this.applyFilter();
        this.cdr.detectChanges();
      }
    });
  }

  calcStats(): void {
    const now = new Date();
    this.totalCount = this.allBookings.length;
    this.occupiedCount = this.allBookings.filter(b => this.isOccupied(b)).length;
    this.upcomingCount = this.allBookings.filter(b => this.isUpcoming(b, now)).length;
    this.completedCount = this.allBookings.filter(b => this.isCompleted(b)).length;
  }

  applyFilter(): void {
    const now = new Date();
    let result = [...this.allBookings];

    if (this.activeTab === 'occupied') {
      result = result.filter(b => this.isOccupied(b));
    } else if (this.activeTab === 'upcoming') {
      result = result.filter(b => this.isUpcoming(b, now));
    } else if (this.activeTab === 'completed') {
      result = result.filter(b => this.isCompleted(b));
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(b =>
        (b.customer?.fullName || '').toLowerCase().includes(q) ||
        (b.room?.roomNumber || '').toString().toLowerCase().includes(q) ||
        (b.customer?.phoneNumber || '').toLowerCase().includes(q)
      );
    }

    this.filteredBookings = result;
  }

  // ✅ FIX: Chỉ coi booking là "Đang ở" nếu nó là booking MỚI NHẤT (theo checkInTime)
  // cho phòng đó, tránh booking cũ "mồ côi" (không qua checkout) tái hiện khi phòng được đặt lại.
  isOccupied(b: any): boolean {
    const bookingStatus = (b.roomStatus || '').toLowerCase();
    const roomStatus = (b.room?.roomStatus || '').toLowerCase();
    const checkIn = new Date(b.checkInTime);

    // Điều kiện cơ bản
    if (!(bookingStatus === 'occupied' && roomStatus === 'occupied' && checkIn <= new Date() && !b.checkOutTime)) {
      return false;
    }

    // ✅ FIX gốc rễ: Trong tất cả booking còn active của cùng phòng, chỉ booking MỚI NHẤT mới là "Đang ở"
    const roomId = b.room?.roomID;
    const latestActive = this.allBookings
      .filter(x =>
        x.room?.roomID === roomId &&
        !x.checkOutTime &&
        (x.roomStatus || '').toLowerCase() === 'occupied'
      )
      .sort((a: any, x: any) => new Date(x.checkInTime).getTime() - new Date(a.checkInTime).getTime())[0];

    return latestActive?.bookingID === b.bookingID;
  }

  // ✅ FIX Bug#1: Thêm || !!b.checkOutTime làm fallback — nếu roomStatus chưa cập nhật kịp nhưng
  // checkOutTime đã được ghi thì vẫn nhận diện đúng là "Đã trả phòng"
  isCompleted(b: any): boolean {
    const s = (b.roomStatus || '').toLowerCase();
    return s === 'đã thanh toán' || s === 'checked out' || !!b.checkOutTime;
  }

  // Sắp đến = booking Occupied + phòng thực tế Occupied + giờ nhận phòng còn trong tương lai
  isUpcoming(b: any, now: Date): boolean {
    const bookingStatus = (b.roomStatus || '').toLowerCase();
    const roomStatus = (b.room?.roomStatus || '').toLowerCase();
    const checkIn = new Date(b.checkInTime);
    return bookingStatus === 'occupied'
      && roomStatus === 'occupied'
      && checkIn > now;
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.applyFilter();
  }

  openDetail(booking: any): void {
    this.selectedBooking = { ...booking };
  }

  closeDetail(): void {
    this.selectedBooking = null;
  }

  goToCheckout(booking: any): void {
    this.router.navigate(['/admin/checkout'], {
      queryParams: { room: booking.room?.roomNumber }
    });
    this.closeDetail();
  }

  onDelete(bookingId: number): void {
    if (!confirm('Bạn có chắc chắn muốn hủy đặt phòng này không?')) return;
    this.hotelService.deleteBooking(bookingId).subscribe({
      next: () => {
        this.allBookings = this.allBookings.filter(b => b.bookingID !== bookingId);
        this.selectedBooking = null;
        this.calcStats();
        this.applyFilter();
        this.cdr.detectChanges();
        this.hotelService.triggerRefreshRooms();
      },
      error: (err: any) => {
        alert('Không thể hủy đặt phòng: ' + (err?.error?.message || 'Lỗi không xác định'));
      }
    });
  }

  getStatusLabel(booking: any): string {
    if (this.isCompleted(booking)) return 'Đã trả phòng';
    // Kiểm tra upcoming trước occupied để tránh nhầm booking tương lai
    if (this.isUpcoming(booking, new Date())) return 'Sắp đến';
    if (this.isOccupied(booking)) return 'Đang ở';
    return booking.roomStatus || 'Chưa xác định';
  }

  getStatusClass(booking: any): string {
    if (this.isCompleted(booking)) return 'status-completed';
    if (this.isUpcoming(booking, new Date())) return 'status-upcoming';
    if (this.isOccupied(booking)) return 'status-occupied';
    return 'status-upcoming';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
