import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Service } from '../../service'; 
import { Customer } from '../rooms/room.model';

@Component({
  selector: 'app-customer-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-management.html',
  styleUrl: './customer-management.css',
})
export class CustomerManagement implements OnInit {
  customers: Customer[] = [];
  searchKey: string = ''; // Từ khóa tìm kiếm

  // --- TRẠNG THÁI HIỆU CHỈNH HỒ SƠ ---
  showEditModal: boolean = false; // Trạng thái ẩn/hiện cửa sổ sửa
  selectedCustomer: Customer = {  // Đối tượng lưu trữ dữ liệu đang chỉnh sửa
    customerID: 0,
    fullName: '',
    phoneNumber: '',
    identityCard: '',
    isStaying: false,
    currentRoomIDs: []
  };

  // --- TRẠNG THÁI LỊCH SỬ LƯU TRÚ ---
  showHistoryModal: boolean = false; // Ẩn/hiện nhật ký
  customerInvoices: any[] = [];      // Danh sách hóa đơn của khách
  totalSpent: number = 0;            // Tổng tiền khách đã chi trả
  constructor(
    private hotelService: Service,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  // Lấy toàn bộ danh sách khách hàng
  loadCustomers(): void {
    // Chú thích báo cáo: Gọi phương thức getAllCustomers từ Service để tải toàn bộ danh bạ khách hàng khi khởi tạo trang.
    this.hotelService.getAllCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Lỗi tải danh sách khách hàng:', err)
    });
  }

  // Bộ lọc khách hàng theo tên, SĐT hoặc CCCD
  get filteredCustomers() {
    if (!this.searchKey) return this.customers;
    const key = this.searchKey.toLowerCase();
    return this.customers.filter(c =>
      (c.fullName || '').toLowerCase().includes(key) ||
      (c.phoneNumber || '').includes(key) ||
      (c.identityCard || '').includes(key)
    );
  }

  /**
   * Kích hoạt chế độ chỉnh sửa hồ sơ
   * Chú thích báo cáo: Sao chép dữ liệu khách hàng vào một đối tượng tạm thời để thực hiện hiệu chỉnh mà không làm thay đổi dữ liệu gốc trên danh sách ngay lập tức.
   */
  onEdit(customer: Customer) {
    this.selectedCustomer = { ...customer }; // Sử dụng Spread Operator để tạo bản sao độc lập
    this.showEditModal = true; // Mở Modal
  }

  /**
   * Truy xuất nhật ký lưu trú và hóa đơn
   * Chú thích báo cáo: Lọc dữ liệu từ bảng Invoice dựa trên customerID và tính toán tổng doanh thu tích lũy từ khách hàng.
   */
  /**
  Chú thích báo cáo: Triển khai cơ chế lọc dữ liệu phía máy khách (Client-side filtering) trên tập dữ liệu hóa đơn tổng quát để tối ưu hóa hiệu suất và tính chính xác của URL API.
   */
  viewHistory(customerObj: any): void {
    const id = customerObj.customerID;
    
    if (id && id !== 0) {
      this.selectedCustomer = { ...customerObj };
      this.customerInvoices = []; 
      
      // Hành động 1: Kích hoạt hiển thị khung nhìn Modal ngay lập tức
      this.showHistoryModal = true;
      this.cdr.detectChanges();

      // Hành động 2: Truy vấn dữ liệu và lọc trực tiếp từ danh sách hóa đơn
      this.hotelService.getAllInvoices().subscribe({
       next: (invoices: any[]) => {
          // Chú thích báo cáo: Thực hiện lọc dữ liệu đa tầng. Kiểm tra ID khách hàng trực tiếp trong Invoice 
          // hoặc truy xuất thông qua đối tượng Booking liên kết để đảm bảo tính toàn vẹn của lịch sử.
        this.customerInvoices = invoices.filter(inv => {
        // Lấy ID khách hàng từ hóa đơn hoặc từ thông tin đặt phòng liên kết
        const customerIdInBooking = inv.booking?.customerID;
        return inv.customerID === id || customerIdInBooking === id;
      });

      // Tổng hợp chi tiêu tích lũy
      this.totalSpent = this.customerInvoices.reduce((sum, inv) => 
        sum + (Number(inv.totalAmount || 0)), 0
          );
          
          // Hành động 3: Cưỡng bức đồng bộ dữ liệu lên giao diện
          setTimeout(() => {
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          }, 50);
        },
        error: (err) => {
          console.error('Lỗi kết nối API Invoice:', err);
          alert('Hệ thống không thể tải danh sách hóa đơn. Vui lòng kiểm tra lại đường dẫn API!');
        }
      });
    } else {
      alert('Hồ sơ khách hàng này không hợp lệ (Mã ID bằng 0 hoặc trống)!');
    }
  }
  /**
   * Gửi yêu cầu cập nhật hồ sơ về Server
   * Chú thích báo cáo: Triển khai phương thức PUT thông qua Service để đồng bộ các thay đổi về thông tin khách hàng vào cơ sở dữ liệu.
   */
  onSaveUpdate(): void {
    if (!this.selectedCustomer.fullName || !this.selectedCustomer.phoneNumber) {
      alert('Họ tên và Số điện thoại không được để trống!');
      return;
    }

    const id = this.selectedCustomer.customerID;
    
    // Chú thích báo cáo: Sử dụng toán tử tam phân để xác định phương thức API (POST hoặc PUT) dựa trên sự tồn tại của ID khách hàng.
    const request = id === 0 
      ? this.hotelService.addCustomer(this.selectedCustomer) 
      : this.hotelService.updateCustomer(id, this.selectedCustomer);

    request.subscribe({
      next: () => {
        alert(id === 0 ? 'Thêm hồ sơ thành công!' : 'Cập nhật hồ sơ thành công!');
        this.showEditModal = false;
        this.loadCustomers();
      },
      error: (err) => {
        console.error('Lỗi thao tác hồ sơ:', err);
        alert('Thao tác thất bại. Vui lòng kiểm tra lại dữ liệu!');
      }
    });
    }

  /**
   * Khởi tạo form thêm khách hàng mới
   * Chú thích báo cáo: Đặt lại đối tượng selectedCustomer về giá trị mặc định với ID = 0 để kích hoạt chế độ thêm mới trên giao diện modal.
   */
  onAddCustomer(): void {
    this.selectedCustomer = { 
      customerID: 0, 
      fullName: '', 
      phoneNumber: '', 
      identityCard: '', 
      isStaying: false, 
      currentRoomIDs: [] 
    };
    this.showEditModal = true;
  }

  /**
   * Xóa vĩnh viễn hồ sơ khách hàng
   * Chú thích báo cáo: Thực hiện phương thức DELETE qua Service sau khi có xác nhận từ người dùng, đảm bảo tính bảo mật và tránh xóa nhầm dữ liệu.
   */
  onDelete(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa hồ sơ khách hàng này không?')) {
      this.hotelService.deleteCustomer(id).subscribe({
        next: () => {
          alert('Đã xóa hồ sơ thành công.');
          this.loadCustomers();
        },
        error: (err) => {
          console.error('Lỗi khi xóa:', err);
          alert('Không thể xóa khách hàng này (có thể do khách đang có lịch sử đặt phòng).');
        }
      });
    }
  } 

  
}