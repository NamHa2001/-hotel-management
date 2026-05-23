import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // Đưa HttpParams lên đây để fix lỗi Dynamic require
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private baseApiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject('API_URL') private apiUrl: string
  ) {
    // Logic xử lý base URL đồng bộ với các service khác trong dự án
    this.baseApiUrl = this.apiUrl.endsWith('/User') 
      ? this.apiUrl.substring(0, this.apiUrl.length - 5) 
      : this.apiUrl;
  }

  /**
   * API: Thực hiện thanh toán và lưu hóa đơn
   * Đã sửa URL để khớp với InvoicesController.cs
   */
  processCheckOut(bookingId: number, invoiceData: any): Observable<any> {
    // Gọi đúng vào InvoicesController và hàm ProcessCheckOut chúng ta vừa tạo
    return this.http.post(`${this.baseApiUrl}/Invoices/ProcessCheckOut/${bookingId}`, invoiceData);
  }

  /**
   * Lấy lịch sử hóa đơn (Dùng nếu bạn muốn in lại hóa đơn cũ)
   */
  getInvoiceById(id: number): Observable<any> {
    return this.http.get(`${this.baseApiUrl}/Invoices/${id}`);
  }

  // Trong InvoiceService.ts
getFullInvoiceHistory(invoiceId: number): Observable<any> {
  return this.http.get(`${this.baseApiUrl}/Invoices/GetFullHistory/${invoiceId}`);
}

// Hàm lấy danh sách tất cả hóa đơn để hiển thị ở trang Quản lý
getAllInvoices(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseApiUrl}/Invoices`);
}

/**

   /**
   * Báo cáo: Lấy số liệu thống kê doanh thu theo khoảng ngày tùy chỉnh
   * Sử dụng HttpParams để truyền tham số an toàn và chuyên nghiệp.
   */
  getRevenueStats(startDate?: string, endDate?: string): Observable<any> {
    // Sửa: Loại bỏ hoàn toàn dòng const { HttpParams } = require...
    let params = new HttpParams();
    
    // Kiểm tra giá trị hợp lệ trước khi gán để tránh gửi tham số rỗng lên Backend
    if (startDate && startDate.trim() !== '') {
      params = params.set('startDate', startDate);
    }
    if (endDate && endDate.trim() !== '') {
      params = params.set('endDate', endDate);
    }
    
    return this.http.get(`${this.baseApiUrl}/Invoices/GetRevenueStats`, { params });
  }
  /**
   * Báo cáo: Thống kê top các dịch vụ mang lại doanh thu cao nhất
   */
  getServicePerformance(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseApiUrl}/Invoices/GetServicePerformance`);
  }
}

