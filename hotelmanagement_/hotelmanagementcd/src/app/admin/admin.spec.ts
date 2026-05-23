import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminComponent } from './admin'; // Đảm bảo tên Class khớp với file .ts của bạn
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Vì Admin là Standalone nên nhét vào imports
      imports: [
        AdminComponent, 
        RouterModule.forRoot([]), // Giả lập Router để không lỗi router-outlet
        CommonModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});