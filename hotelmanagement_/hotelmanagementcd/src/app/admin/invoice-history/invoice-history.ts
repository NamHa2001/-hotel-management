import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../invoice.service'; // Đảm bảo đường dẫn này đúng với dự án của bạn

@Component({
  selector: 'app-invoice-history',
  standalone: true,
  // Thêm CommonModule và FormsModule để dùng được bảng và input tìm kiếm
  imports: [CommonModule, FormsModule], 
  templateUrl: './invoice-history.html',
  styleUrl: './invoice-history.css'
})
export class InvoiceHistory implements OnInit {
  invoices: any[] = []; // Chứa dữ liệu gốc từ SQL
  filteredInvoices: any[] = []; // Chứa dữ liệu sau khi lọc
  
  // Các biến ràng buộc cho bộ lọc
  searchText: string = '';
  startDate: string = '';
  endDate: string = '';
  selectedMethod: string = '';

  constructor(private invoiceService: InvoiceService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  // Báo cáo: Tải dữ liệu hóa đơn từ Server thông qua Service
  loadInvoices(): void {
    // Báo cáo: Gọi đúng tên hàm getAllInvoices đã khai báo trong InvoiceService
    this.invoiceService.getAllInvoices().subscribe({
      next: (data) => {
        this.invoices = data;
        this.filteredInvoices = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi tải lịch sử hóa đơn:', err);
        alert('Không thể kết nối với máy chủ để lấy danh sách hóa đơn!');
      }
    });
  }

  // Lọc thống nhất: tìm kiếm + ngày + phương thức thanh toán
  applyFilter(): void {
    const start = this.startDate ? new Date(this.startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    const end = this.endDate ? new Date(this.endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    this.filteredInvoices = this.invoices.filter(inv => {
      const matchSearch = !this.searchText ||
        (inv.invoiceID?.toString() || '').includes(this.searchText) ||
        (inv.booking?.customer?.fullName || '').toLowerCase().includes(this.searchText.toLowerCase());

      const matchMethod = !this.selectedMethod || inv.paymentMethod === this.selectedMethod;

      const invDate = new Date(inv.invoiceDate);
      const matchDate = (!start || invDate >= start) && (!end || invDate <= end);

      return matchSearch && matchMethod && matchDate;
    });
  }

  // Báo cáo: Tính tổng doanh thu tháng hiện tại cho phần Header
  getTotalRevenue(): number {
    return this.filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  }
  // Khai báo biến hỗ trợ Modal chi tiết (Báo cáo: Dùng để lưu trữ dữ liệu từ API trước khi hiển thị)
  selectedInvoiceDetail: any = null; 
  showDetailModal: boolean = false;

  // Báo cáo: Hàm gọi API lấy đầy đủ thông tin tiền phòng và dịch vụ của một hóa đơn
  viewDetail(id: number): void {
    this.invoiceService.getFullInvoiceHistory(id).subscribe({
      next: (data) => {
        this.selectedInvoiceDetail = data;
        this.showDetailModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi khi lấy chi tiết hóa đơn:', err);
        alert('Hệ thống không thể tải thông tin chi tiết của hóa đơn này!');
      }
    });
  }

  // Gọi applyFilter thống nhất — cả date + text + method đều kết hợp
  onFilterByDate(): void {
    if (!this.startDate || !this.endDate) {
      alert('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc!');
      return;
    }
    this.applyFilter();
  }
  // Báo cáo: Hàm đặt lại bộ lọc về trạng thái ban đầu
  resetFilter(): void {
    this.searchText = '';
    this.startDate = '';
    this.endDate = '';
    this.selectedMethod = '';
    this.filteredInvoices = [...this.invoices];
    this.cdr.detectChanges();
  }

  // Báo cáo: Hàm giả lập xuất dữ liệu ra Excel (Có thể phát triển thêm thư viện xlsx sau này)
  exportToExcel(): void {
    if (this.filteredInvoices.length === 0) {
      alert('Không có dữ dữ liệu để xuất báo cáo!');
      return;
    }
    console.log('Đang xuất danh sách hóa đơn ra Excel...');
    alert('Hệ thống đang khởi tạo file báo cáo cho ' + this.filteredInvoices.length + ' hóa đơn.');
  }

  // ✅ FIX Bug#10: Tải chi tiết hóa đơn rồi in (mở cửa sổ in của trình duyệt)
  printInvoice(id: number): void {
    this.invoiceService.getFullInvoiceHistory(id).subscribe({
      next: (data) => {
        this.selectedInvoiceDetail = data;
        this.showDetailModal = true;
        this.cdr.detectChanges();
        // Trễ nhỏ để modal render xong rồi mới gọi print
        setTimeout(() => window.print(), 300);
      },
      error: () => alert('Không thể tải thông tin hóa đơn để in!')
    });
  }

  // ✅ FIX Bug#10: In hóa đơn đang xem trong modal
  printCurrentInvoice(): void {
    if (!this.selectedInvoiceDetail) return;
    window.print();
  }
}