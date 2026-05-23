import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRooms } from './user-rooms';

describe('UserRooms', () => {
  let component: UserRooms;
  let fixture: ComponentFixture<UserRooms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRooms]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserRooms);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
