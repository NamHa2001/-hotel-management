import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoomDetailComponent } from './room-detail'; // Đảm bảo đúng tên file và class
import { Service } from '../../service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('RoomDetailComponent', () => {
  let component: RoomDetailComponent;
  let fixture: ComponentFixture<RoomDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomDetailComponent, FormsModule], // Import component và forms
      providers: [
        { provide: Service, useValue: { getRooms: () => of([]) } }, // Giả lập Service
        { 
          provide: ActivatedRoute, 
          useValue: { snapshot: { paramMap: { get: () => '1' } } } // Giả lập ID = 1 trên URL
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});