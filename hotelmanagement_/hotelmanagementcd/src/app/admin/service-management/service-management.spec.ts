import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceManagement } from './service-management';

describe('ServiceManagement', () => {
  let component: ServiceManagement;
  let fixture: ComponentFixture<ServiceManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
