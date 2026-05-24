import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs'; // Thêm Subject vào đây
import { Router } from '@angular/router';
import { DashboardData } from './admin/dashboard/dashboard.model';
import { Room, RoomType, Customer } from './admin/rooms/room.model';

@Injectable({
  providedIn: 'root',
})
export class Service {
  private baseApiUrl: string;
  private userApiUrl: string;

  // Chú thích báo cáo: Kênh phát tín hiệu (Subject) để đồng bộ dữ liệu giữa các Component.
  private refreshRoomsSource = new Subject<void>();
  
  // Các Component khác sẽ lắng nghe (Subscribe) vào biến này
  public refreshRooms$ = this.refreshRoomsSource.asObservable();

  /**
   * Phương thức kích hoạt làm mới dữ liệu
   * Chú thích: Phát tín hiệu để các trang khác biết và tự động load lại dữ liệu phòng.
   */
  triggerRefreshRooms() {
    this.refreshRoomsSource.next();
  }

  constructor(
    private http: HttpClient,
    @Inject('API_URL') private apiUrl: string,
    private router: Router
  ) {
    this.userApiUrl = this.apiUrl;
    this.baseApiUrl = this.apiUrl.endsWith('/User') 
      ? this.apiUrl.substring(0, this.apiUrl.length - 5) 
      : this.apiUrl;
  }

  // --- HỆ THỐNG & XÁC THỰC ---
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.userApiUrl}/Login`, { userName: username, passwords: password });
  }

  saveUserToken(data: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userToken', JSON.stringify(data));
    }
  }
/**
   * Truy xuất thông tin người dùng hiện tại
   * Chú thích báo cáo: Đọc dữ liệu định danh và quyền hạn được lưu trữ trong LocalStorage để phục vụ hiển thị thông tin cá nhân trên giao diện.
   */
  getUserInfo(): any {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('userToken');
      return data ? JSON.parse(data) : null;
    }
    return null;
  }
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userToken');
    }
    this.router.navigate(['/login']);
  }

  // --- QUẢN LÝ NGHIỆP VỤ PHÒNG (ROOMS) ---
  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.baseApiUrl}/Room`);
  }

  addRoom(roomData: Partial<Room>): Observable<any> {
    return this.http.post(`${this.baseApiUrl}/Room`, roomData);
  }

  updateRoom(id: number, roomData: Partial<Room>): Observable<any> {
    return this.http.put(`${this.baseApiUrl}/Room/${id}`, roomData);
  }

  deleteRoom(id: number): Observable<any> {
    return this.http.delete(`${this.baseApiUrl}/Room/${id}`);
  }

  getRoomTypes(): Observable<RoomType[]> {
    return this.http.get<RoomType[]>(`${this.baseApiUrl}/RoomType`);
  }

  // --- QUẢN LÝ ĐẶT PHÒNG & THANH TOÁN (BOOKING) ---
  createBooking(bookingData: any): Observable<any> {
    return this.http.post(`${this.baseApiUrl}/Booking`, bookingData);
  }

  updateBooking(id: number, bookingData: any): Observable<any> {
    return this.http.put(`${this.baseApiUrl}/Booking/${id}`, bookingData);
  }

  markInspected(bookingId: number, note: string): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.put(`${this.baseApiUrl}/Booking/MarkInspected/${bookingId}`, JSON.stringify(note), { headers });
  }

  // ✅ FIX Bug#5: Đã xóa phương thức checkOut() vì nó gọi endpoint PUT /Booking/CheckOut/{id}
  // mà KHÔNG TỒN TẠI ở Backend. Checkout thực tế được thực hiện qua InvoiceService.processCheckOut().

  // --- QUẢN LÝ DỊCH VỤ (SERVICES) ---
  
  /**
   * FIX: Gọi đúng OderServicesController (viết là OderServices)
   * Khớp với [HttpGet("GetUsedServices/{bookingId}")] ở Backend
   */
  getUsedServices(bookingId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseApiUrl}/OderServices/GetUsedServices/${bookingId}`);
  }

  getServices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseApiUrl}/Service`);
  }

  addService(serviceData: any): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}/Service`, serviceData);
  }

  updateService(id: number, serviceData: any): Observable<any> {
    return this.http.put(`${this.baseApiUrl}/Service/${id}`, serviceData);
  }

  deleteService(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseApiUrl}/Service/${id}`);
  }

  /**
   * FIX: Đổi endpoint thành /OderServices để khớp với OderServicesController
   * Dữ liệu truyền vào sử dụng PascalCase (BookingID, ServiceID, Quantity) 
   * để khớp hoàn toàn với OderRequest DTO ở Backend.
   */
  addBookingService(data: { BookingID: number, ServiceID: number, Quantity: number }): Observable<any> {
    return this.http.post(`${this.baseApiUrl}/OderServices`, data);
  }

  // --- QUẢN LÝ KHÁCH HÀNG & THỐNG KÊ ---
  searchCustomer(params: { identityCard?: string; phoneNumber?: string }): Observable<Customer[]> {
    let queryParams = new HttpParams();
    if (params.identityCard) queryParams = queryParams.append('identityCard', params.identityCard);
    if (params.phoneNumber) queryParams = queryParams.append('phoneNumber', params.phoneNumber);
    return this.http.get<Customer[]>(`${this.baseApiUrl}/Customer/Search`, { params: queryParams });
  }

  addCustomer(customerData: Customer): Observable<Customer> {
    return this.http.post<Customer>(`${this.baseApiUrl}/Customer`, customerData);
  }

  /**
   * Lấy danh sách tất cả khách hàng
   * Chú thích: Phục vụ hiển thị toàn bộ danh bạ tại trang quản trị hồ sơ.
   */
  getAllCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.baseApiUrl}/Customer`);
  }

  /**
   * Cập nhật thông tin khách hàng hiện có
   */
  updateCustomer(id: number, customerData: Customer): Observable<any> {
    return this.http.put(`${this.baseApiUrl}/Customer/${id}`, customerData);
  }

  /**
   * Xóa hồ sơ khách hàng theo ID
   * Chú thích báo cáo: Triển khai phương thức DELETE để gỡ bỏ thông tin khách hàng khỏi hệ thống cơ sở dữ liệu thông qua API.
   */
  deleteCustomer(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseApiUrl}/Customer/${id}`);
  }
  getDashboardSummary(): Observable<DashboardData> {
    // Sửa từ DashboardDto/summary thành Dashboard/summary để khớp với Controller mới
    return this.http.get<DashboardData>(`${this.baseApiUrl}/Dashboard/summary`);
  }

  // --- QUẢN LÝ HÓA ĐƠN & BÁO CÁO ---
  /**
   * Lấy danh sách toàn bộ hóa đơn
   * Chú thích báo cáo: Truy xuất tập hợp dữ liệu hóa đơn tổng thể từ hệ thống để phục vụ công tác lọc và thống kê lịch sử khách hàng tại phía Client.
   */
  getAllInvoices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseApiUrl}/Invoices`);
  }

  // --- QUẢN LÝ ĐẶT PHÒNG ---
  getBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseApiUrl}/Booking`);
  }

  deleteBooking(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseApiUrl}/Booking/${id}`);
  }
}