  export interface RoomType {
    roomTypeID: number;
    typeName: string;
    pricePerHour: number;
    pricePerNight: number;
  }



  export interface Customer {
    customerID: number;
    fullName: string;
    identityCard: string;
    isStaying?: boolean;
  currentRoomIDs?: number[];
    phoneNumber: string;
    address?: string; // Bổ sung để đầy đủ thông tin khách hàng nếu cần
  }

  export interface Booking {
    bookingID: number;
    roomStatus?: string; // Khớp với public string? RoomStatus trong C#
    checkInTime: string | Date; // Dùng Date để dễ xử lý tính toán ở FE
    checkOutTime?: string | Date;
    totalRoomPrice: number; // Trong C# là decimal, mapping sang number
    isInspected?: boolean;
    inspectionNote?: string;
    roomID: number;
    room?: Room; // Bổ sung để nhận dữ liệu Room từ Include(b => b.Room)
    
    customerID: number;
    customer?: Customer;

    // Thuộc tính [NotMapped] từ Backend trả về
    totalHours?: number; 
  }

  export interface Room {
    roomID: number;
    roomNumber: string;
    roomStatus: string;
    roomTypeID: number;
    roomType?: RoomType;
    bookings?: Booking[];
  }