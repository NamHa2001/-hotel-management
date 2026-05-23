export interface Invoice {
    invoiceID?: number;          // Có dấu ? vì khi gửi lên Backend chưa có ID này
    bookingID: number;           // ID của đơn đặt phòng
    invoiceDate: Date | string;  // Ngày xuất hóa đơn
    roomSubTotal: number;        // Tiền phòng
    serviceSubTotal: number;     // Tiền dịch vụ
    discountPercentage: number;  // % Giảm giá
    taxPercentage: number;       // % Thuế
    totalAmount: number;         // Tổng tiền cuối cùng sau thuế/giảm giá
    paymentMethod: string;       // Phương thức: Tiền mặt, Chuyển khoản...
    staffName: string;           // Tên nhân viên thực hiện
}