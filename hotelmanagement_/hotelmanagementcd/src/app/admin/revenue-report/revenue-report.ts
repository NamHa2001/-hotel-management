import { FormsModule } from '@angular/forms';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { InvoiceService } from '../../invoice.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-revenue-report',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule // Bổ sung FormsModule vào đây để sử dụng được [(ngModel)]
  ],
  templateUrl: './revenue-report.html',
  styleUrl: './revenue-report.css',
})
export class RevenueReport implements OnInit {
  @ViewChild('revenueChart') revenueChart!: ElementRef;
  
  stats: any = {
    roomRevenue: 0,
    serviceRevenue: 0,
    totalRevenue: 0,
    chartData: []
  };
  
  topServices: any[] = [];
  today: Date = new Date();
  private chart: any; // Lưu trữ đối tượng chart để tránh vẽ chồng lên nhau
// Biến phục vụ tính năng lọc và hiển thị chuyên nghiệp
  filter = {
    startDate: '',
    endDate: ''
  };
  displayRange: string = '7 ngày gần nhất';
  // Bổ sung ChangeDetectorRef vào constructor
  constructor(
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef 
  ) {}

 ngOnInit(): void {
    // Sử dụng setTimeout để đẩy việc load dữ liệu vào cuối hàng đợi xử lý
    // giúp tránh lỗi tranh chấp tài nguyên khi F5
    setTimeout(() => {
      this.loadRevenueData();
      this.loadServicePerformance();
    }, 150);
  }

  loadRevenueData(): void {
    this.invoiceService.getRevenueStats(this.filter.startDate, this.filter.endDate).subscribe({
      next: (res: any) => {
        if (res) {
          this.stats.roomRevenue = res.roomRevenue ?? res.RoomRevenue ?? 0;
          this.stats.serviceRevenue = res.serviceRevenue ?? res.ServiceRevenue ?? 0;
          this.stats.totalRevenue = res.totalRevenue ?? res.TotalRevenue ?? 0;
          this.displayRange = res.displayRange ?? res.DisplayRange ?? '7 ngày gần nhất';

          this.cdr.detectChanges(); 

          const finalChartData = res.chartData ?? res.ChartData;
          // KIỂM TRA CHẶT CHẼ: Chỉ vẽ biểu đồ khi có ElementRef và dữ liệu hợp lệ
          if (this.revenueChart && this.revenueChart.nativeElement && finalChartData && Array.isArray(finalChartData)) {
            this.initChart(finalChartData);
          }
        }
      },
      error: (err) => {
        console.error('Lỗi kết nối API Invoices:', err);
        // Reset về 0 nếu lỗi để tránh hiển thị dữ liệu rác
        this.stats.totalRevenue = 0;
        this.cdr.detectChanges();
      }
    });
  }

  // Hàm thực hiện lọc dữ liệu khi nhấn nút
  onFilter(): void {
    if (this.filter.startDate && this.filter.endDate) {
      this.loadRevenueData();
    } else {
      alert('Vui lòng chọn đầy đủ từ ngày và đến ngày!');
    }
  }

  // Hàm in báo cáo chuyên nghiệp
  printReport(): void {
    window.print();
  }

  loadServicePerformance(): void {
    this.invoiceService.getServicePerformance().subscribe({
      next: (res) => {
        this.topServices = res;
        this.cdr.detectChanges();
      }
    });
  }

  initChart(data: any[]): void {
    const ctx = this.revenueChart.nativeElement.getContext('2d');
    
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'line', 
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Doanh thu (VNĐ)',
          data: data.map(d => d.value),
          // Heritage Gold: Màu vàng đồng đặc trưng
          borderColor: '#C5A059',
          backgroundColor: 'rgba(197, 160, 89, 0.05)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false } 
        },
        scales: {
          y: { 
            beginAtZero: true,
            grid: { color: '#F1EFE9' },
            ticks: { font: { family: 'Plus Jakarta Sans' } }
          },
          x: { 
            grid: { display: false },
            ticks: { font: { family: 'Plus Jakarta Sans' } }
          }
        }
      }
    });
  }
}