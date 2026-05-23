import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerManagement } from './customer-management';

describe('CustomerManagement', () => {
  let component: CustomerManagement;
  let fixture: ComponentFixture<CustomerManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
