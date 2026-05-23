import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceHistory } from './invoice-history';

describe('InvoiceHistory', () => {
  let component: InvoiceHistory;
  let fixture: ComponentFixture<InvoiceHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoiceHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
