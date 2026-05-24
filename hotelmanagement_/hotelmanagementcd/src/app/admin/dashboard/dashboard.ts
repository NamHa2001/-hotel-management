import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, ViewEncapsulation, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartData } from 'chart.js';
import { Service } from '../../service';
import { InvoiceService } from '../../invoice.service'; // ✅ FIX Bug#11: Import InvoiceService để gọi service performance

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
    private invoiceService: InvoiceService, // ✅ FIX Bug#11
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
  // ✅ FIX Bug#11: Xóa "Đã đặt" — backend không trả về phongDaDat
  public roomUsageData: ChartData<'pie'> = {
    labels: ['Trống', 'Đang ở', 'Đang dọn'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#EAE2D3', '#C5A059', '#8E6D31']
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

  // --- 3. PHÂN BỐ PHƯƠNG THỨC THANH TOÁN (PIE CHART) ---
  // ✅ FIX Bug#11: Thay thế "Loại khách" (backend không có dữ liệu)
  // bằng "Phương thức thanh toán" lấy từ API getServicePerformance
  public customerTypeData: ChartData<'pie'> = {
    labels: ['Tiền mặt', 'Chuyển khoản', 'Thẻ tín dụng'],
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
    // ── Tải dữ liệu thống kê tổng quan ──
    this.hotelService.getDashboardSummary().subscribe({
      next: (data: any) => {
        this.stats = data;

        // Backend trả về camelCase (ASP.NET Core default JSON serialization)
        const revenueLabels = data.revenueLabels ?? data.RevenueLabels ?? [];
        const revenueValues = data.revenueValues ?? data.RevenueValues ?? [];

        // ✅ FIX Bug#11: Biểu đồ đường — Doanh thu 7 ngày (dữ liệu thực từ backend)
        this.lineChartData = {
          ...this.lineChartData,
          labels: revenueLabels,
          datasets: [{ ...this.lineChartData.datasets[0], data: revenueValues }]
        };

        // ✅ FIX Bug#11: Biểu đồ tròn phòng — bỏ "Đã đặt" vì backend không có trường này
        this.roomUsageData = {
          ...this.roomUsageData,
          datasets: [{
            ...this.roomUsageData.datasets[0],
            data: [
              data.phongTrong    ?? data.PhongTrong    ?? 0,
              data.phongDangThue ?? data.PhongDangThue ?? 0,
              data.phongDangDon  ?? data.PhongDangDon  ?? 0
            ]
          }]
        };

        this.cdr.detectChanges();
        setTimeout(() => { if (this.chart) this.chart.update(); }, 300);
      },
      error: (err) => console.error('Lỗi tải Dashboard Summary:', err)
    });

    // ✅ FIX Bug#11: Tải Top 5 dịch vụ từ endpoint chuyên biệt (thay vì lấy từ summary)
    this.invoiceService.getServicePerformance().subscribe({
      next: (perf: any[]) => {
        this.serviceBarData = {
          ...this.serviceBarData,
          labels: perf.map(s => s.serviceName || s.ServiceName || ''),
          datasets: [{
            ...this.serviceBarData.datasets[0],
            data: perf.map(s => s.revenue ?? s.Revenue ?? 0)
          }]
        };
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Lỗi tải Service Performance:', err)
    });

    // ✅ FIX Bug#11: Tải phân bố phương thức thanh toán từ invoice history
    this.invoiceService.getAllInvoices().subscribe({
      next: (invoices: any[]) => {
        const cash     = invoices.filter(i => i.paymentMethod === 'Tiền mặt').length;
        const transfer = invoices.filter(i => i.paymentMethod === 'Chuyển khoản').length;
        const card     = invoices.filter(i => i.paymentMethod === 'Thẻ tín dụng').length;

        this.customerTypeData = {
          ...this.customerTypeData,
          datasets: [{
            ...this.customerTypeData.datasets[0],
            data: [cash, transfer, card]
          }]
        };
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Lỗi tải Invoice data:', err)
    });
  }

  logout() {
    if (this.isBrowser) {
      localStorage.removeItem('userToken');
      this.router.navigate(['/login']);
    }
  }
}