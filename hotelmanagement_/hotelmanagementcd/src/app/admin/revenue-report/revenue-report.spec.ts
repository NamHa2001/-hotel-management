import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevenueReport } from './revenue-report';

describe('RevenueReport', () => {
  let component: RevenueReport;
  let fixture: ComponentFixture<RevenueReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RevenueReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevenueReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
