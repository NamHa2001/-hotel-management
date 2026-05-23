import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CheckoutComponent } from './checkout'; // Sửa lại đường dẫn và tên Class

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Vì CheckoutComponent là Standalone, chúng ta đưa vào imports
      imports: [CheckoutComponent] 
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});