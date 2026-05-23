import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Service } from '../../service'; 

@Component({
  selector: 'app-service-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-management.html',
  styleUrl: './service-management.css',
})
export class ServiceManagement implements OnInit {
  currentUser: any = null;
  services: any[] = [];
  searchText: string = ''; // Nội dung tìm kiếm

  constructor(
    private dataService: Service,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Chỉ thực thi truy cập tài nguyên trình duyệt (localStorage, API) khi ở Client
    if (isPlatformBrowser(this.platformId)) {
      this.initializeData();
    }
  }

  /**
   * Khởi tạo dữ liệu người dùng và danh sách dịch vụ
   * Tách biệt logic để code sạch và dễ bảo trì
   */
  private initializeData(): void {
    const userData = localStorage.getItem('userToken');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
      } catch (error) {
        console.error('Lỗi phân giải dữ liệu người dùng:', error);
      }
    }
    
    this.getList();
  }

  /**
   * Lấy danh sách dịch vụ từ Backend
   * Sử dụng cơ chế phát hiện thay đổi trực tiếp, không dùng setTimeout mẹo vặt
   */
  getList(): void {
    this.dataService.getServices().subscribe({
      next: (data) => {
        this.services = data;
        // Thông báo cho Angular cập nhật giao diện ngay khi dữ liệu vừa về
        this.cdr.markForCheck(); 
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách dịch vụ:', err);
      }
    });
  }

  /**
 * Lọc danh sách dịch vụ theo tên dựa trên searchText
 * Chú thích báo cáo: Triển khai tính năng tìm kiếm động (Dynamic Search) giúp tối ưu thời gian tra cứu danh mục.
 */
get filteredServices() {
  if (!this.searchText) return this.services;
  return this.services.filter(s => 
    (s.serviceName || s.ServiceName).toLowerCase().includes(this.searchText.toLowerCase())
  );
}

  /**
   * Xóa dịch vụ dựa trên ID
   * @param id Mã dịch vụ (bất kể kiểu dữ liệu nào từ template truyền vào)
   * @param name Tên dịch vụ để hiển thị thông báo xác nhận
   */
  onDelete(id: any, name: string): void {
    const serviceId = Number(id);
    if (isNaN(serviceId)) {
      alert('Mã dịch vụ không hợp lệ.');
      return;
    }

    if (confirm(`Hệ thống sẽ xóa vĩnh viễn dịch vụ: ${name}. Bạn có chắc chắn không?`)) {
      this.dataService.deleteService(serviceId).subscribe({
        next: () => {
          alert('Xóa thành công!');
          this.getList(); // Tải lại danh sách để đồng bộ giao diện
        },
        error: (err) => {
          console.error('Lỗi xóa dịch vụ:', err);
          alert('Không thể xóa dịch vụ này. Có thể dữ liệu đang được liên kết với hóa đơn.');
        }
      });
    }
  }
  newService: any = {
    serviceName: '',
    unit: '',
    price: 0
  };

  // Biến điều khiển ẩn/hiện Form
  isShowingAddForm: boolean = false;
// Biến xác định đang ở chế độ Thêm hay Sửa
  isEditMode: boolean = false;
  // ... các hàm cũ (getList, onDelete) giữ nguyên

  /**
   * Hàm xử lý Thêm mới dịch vụ
   */
  onAddService(): void {
    // 1. Kiểm tra tính hợp lệ cơ bản (Validation)
    if (!this.newService.serviceName || !this.newService.unit || this.newService.price <= 0) {
      alert('Vui lòng nhập đầy đủ thông tin và đơn giá phải lớn hơn 0.');
      return;
    }

    // 2. Gọi Service để lưu vào Backend
    this.dataService.addService(this.newService).subscribe({
      next: (res) => {
        alert('Thêm dịch vụ mới thành công!');
        this.getList();          // Tải lại bảng dữ liệu
        this.resetForm();        // Xóa trắng form và đóng lại
      },
      error: (err) => {
        console.error('Lỗi khi thêm dịch vụ:', err);
        alert('Không thể thêm dịch vụ. Vui lòng kiểm tra lại kết nối Server.');
      }
    });
  }

  /**
   * Xóa trắng dữ liệu nhập và đóng form
   */
  resetForm(): void {
    this.newService = { serviceName: '', unit: '', price: 0 };
    this.isShowingAddForm = false;
    this.isEditMode = false;
  }

  /**
   * Chế độ sửa: Đổ dữ liệu từ hàng được chọn lên form
   * Sử dụng bản sao để tránh thay đổi trực tiếp trên bảng khi chưa lưu
   */
  onEdit(service: any): void {
    this.isEditMode = true;
    this.isShowingAddForm = true;
    
    this.newService = { 
      serviceID: service.serviceID || service.ServiceID,
      serviceName: service.serviceName || service.ServiceName,
      unit: service.unit || service.Unit,
      price: service.price || service.Price
    };
    
    // Cuộn lên đầu trang mượt mà để Admin thấy form
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Gọi API để cập nhật dịch vụ hiện tại
   */
  updateService(): void {
    const id = this.newService.serviceID;
    this.dataService.updateService(id, this.newService).subscribe({
      next: () => {
        alert('Cập nhật thông tin thành công!');
        this.getList();   // Tải lại danh sách
        this.resetForm(); // Trở về trạng thái ban đầu
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật dịch vụ:', err);
        alert('Cập nhật thất bại, vui lòng kiểm tra lại!');
      }
    });
  }

}