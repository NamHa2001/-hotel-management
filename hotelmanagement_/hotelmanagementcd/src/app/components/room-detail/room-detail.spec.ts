import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomDetail } from './room-detail';

describe('RoomDetail', () => {
  let component: RoomDetail;
  let fixture: ComponentFixture<RoomDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
