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

  // ✅ FIX Bug#16: Xuất thực tế danh sách hóa đơn ra file CSV (mở được bằng Excel)
  exportToExcel(): void {
    if (this.filteredInvoices.length === 0) {
      alert('Không có dữ liệu để xuất báo cáo!');
      return;
    }

    // Header hàng tiêu đề (dùng dấu ; để Excel Việt Nam tự tách cột)
    const headers = ['Mã HĐ', 'Ngày lập', 'Khách hàng', 'Phòng', 'PT Thanh Toán', 'Tiền phòng', 'Tiền DV', 'Tổng tiền'];

    // Map dữ liệu sang mảng giá trị, escape dấu phẩy trong chuỗi
    const rows = this.filteredInvoices.map(inv => [
      inv.invoiceID ?? '',
      inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('vi-VN') : '',
      (inv.booking?.customer?.fullName || 'Khách vãng lai').replace(/,/g, ' '),
      inv.booking?.room?.roomNumber ?? '',
      inv.paymentMethod ?? '',
      inv.roomSubTotal ?? 0,
      inv.serviceSubTotal ?? 0,
      inv.totalAmount ?? 0
    ]);

    // Thêm hàng tổng cộng ở cuối
    const totalAmount = this.filteredInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    rows.push(['', '', '', '', 'TỔNG CỘNG', '', '', totalAmount]);

    // Ghép nội dung CSV — dùng tab (\t) để Excel Windows nhận đúng
    const csvContent = '﻿' // BOM UTF-8 để Excel hiển thị tiếng Việt đúng
      + [headers, ...rows].map(r => r.join('\t')).join('\n');

    // Tạo Blob và trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    link.href = url;
    link.download = `HoaDon_${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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