import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Service } from '../../service';

@Component({
  selector: 'app-booking-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.html',
  styleUrl: './booking.css'
})
export class BookingManagement implements OnInit {
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
    this.hotelService.refreshRooms$.subscribe(() => this.loadBookings());
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

  isOccupied(b: any): boolean {
    return (b.roomStatus || '').toLowerCase() === 'occupied';
  }

  isCompleted(b: any): boolean {
    const s = (b.roomStatus || '').toLowerCase();
    return s === 'đã thanh toán' || s === 'checked out';
  }

  private isUpcoming(b: any, now: Date): boolean {
    const checkIn = new Date(b.checkInTime);
    return checkIn > now && !this.isCompleted(b);
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
    if (this.isOccupied(booking)) return 'Đang ở';
    const checkIn = new Date(booking.checkInTime);
    if (checkIn > new Date()) return 'Sắp đến';
    return booking.roomStatus || 'Chưa xác định';
  }

  getStatusClass(booking: any): string {
    if (this.isCompleted(booking)) return 'status-completed';
    if (this.isOccupied(booking)) return 'status-occupied';
    return 'status-upcoming';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
