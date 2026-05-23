import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, ViewEncapsulation, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartData } from 'chart.js';
import { Service } from '../../service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  encapsulation: ViewEncapsulation.None, 
})
export class Dashboard implements OnInit {
  currentUser: any = null;
  isBrowser: boolean = false;
  stats: any = null;

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private hotelService: Service,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // --- 1. BIỂU ĐỒ DOANH THU THEO NGÀY (LINE CHART) ---
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [], // Sẽ load từ API
    datasets: [{
      data: [],
      label: 'Doanh thu (VNĐ)',
      borderColor: '#C5A059', // Màu Vàng Đồng Heritage
      backgroundColor: 'rgba(197, 160, 89, 0.05)',
      fill: true,
      tension: 0.4,
      pointRadius: 2,
      pointHoverRadius: 5,
      borderWidth: 2
    }]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: '#f0f2f8' }, 
        ticks: { color: '#A3AED0' } 
      },
      x: { 
        grid: { display: false }, 
        ticks: { color: '#A3AED0' } 
      }
    }
  };

  // --- 2. TỈ LỆ SỬ DỤNG PHÒNG (PIE CHART) ---
  public roomUsageData: ChartData<'pie'> = {
    labels: ['Trống', 'Đang ở', 'Đang dọn', 'Đã đặt'],
    datasets: [{
      data: [0, 0, 0, 0],
      // Sử dụng dải màu Heritage từ đậm đến nhạt
      backgroundColor: ['#EAE2D3', '#C5A059', '#8E6D31', '#1A1C1E']
    }]
  };

  public pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: 'right', 
        labels: { boxWidth: 12, font: { size: 11 } } 
      } 
    }
  };

  // --- 3. DỮ LIỆU PHỤ (GIỮ NGUYÊN CODE CỦA BẠN) ---
  public customerTypeData: ChartData<'pie'> = {
    labels: ['Khách lẻ', 'Khách đoàn', 'Công ty'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#4318FF', '#6AD2FF', '#EFF4FB']
    }]
  };

  public serviceBarData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Doanh thu (VNĐ)',
      backgroundColor: '#7551FF',
      borderRadius: 10
    }]
  };

  public barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
  };

  ngOnInit(): void {
    if (this.isBrowser) {
      const userData = localStorage.getItem('userToken');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        this.loadDashboardData();
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  loadDashboardData() {
    this.hotelService.getDashboardSummary().subscribe({
      next: (data: any) => {
        this.stats = data;

        // Sửa lỗi hiển thị biểu đồ: Backend thường trả về camelCase (doanhThuThang) 
        // hoặc PascalCase (DoanhThuThang). Ta sẽ kiểm tra cả hai.
        const currentMonthRevenue = data.doanhThuThang ?? data.DoanhThuThang ?? 0;
        const revenueLabels = data.revenueLabels ?? data.RevenueLabels ?? this.lineChartData.labels;
        const revenueValues = data.revenueValues ?? data.RevenueValues ?? [];

        // Cập nhật biểu đồ đường (Doanh thu theo ngày)
        this.lineChartData = {
          ...this.lineChartData,
          labels: revenueLabels,
          datasets: [{ 
            ...this.lineChartData.datasets[0], 
            data: revenueValues
          }]
        };

        // Ép biểu đồ cập nhật lại ngay lập tức
        this.cdr.detectChanges();
        if (this.chart) {
          this.chart.update();
        }

        // Cập nhật biểu đồ tròn (Trạng thái phòng)
        this.roomUsageData = {
          ...this.roomUsageData,
          datasets: [{ 
            ...this.roomUsageData.datasets[0], 
            data: [
              data.phongTrong || 0, 
              data.phongDangThue || 0, 
              data.phongDangDon || 0, 
              data.phongDaDat || 0
            ] 
          }]
        };

        // Giữ nguyên các báo cáo khác của bạn
        this.customerTypeData = {
          ...this.customerTypeData,
          datasets: [{ 
            ...this.customerTypeData.datasets[0], 
            data: [data.khachLe || 0, data.khachDoan || 0, data.khachCongTy || 0] 
          }]
        };

        this.serviceBarData = {
          ...this.serviceBarData,
          labels: data.serviceNames || [],
          datasets: [{ ...this.serviceBarData.datasets[0], data: data.serviceValues || [] }]
        };

        this.cdr.detectChanges();
        setTimeout(() => {
          if (this.chart) this.chart.update();
        }, 300);
      },
      error: (err) => console.error('Lỗi Backend:', err)
    });
  }

  logout() {
    if (this.isBrowser) {
      localStorage.removeItem('userToken');
      this.router.navigate(['/login']);
    }
  }
}