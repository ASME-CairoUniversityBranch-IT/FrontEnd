import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
// لو عندك Service جاهزة استدعيها هنا:
// import { ReservationService } from '../../services/reservation.service';

export interface ReservationData {
  id: number;
  deadlineDate: string; // مثال: '2026-05-15T23:59:00'
  remainingSpots?: number; // اختياري لو عايز تعرض الأماكن المتبقية
}

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, HttpClientModule], // HttpClientModule عشان الـ API
  templateUrl: './reservation.html', // أو reservation.component.html حسب تسمية ملفاتك
  styleUrls: ['./reservation.css']   // أو reservation.component.css
})
export class ReservationComponent implements OnInit {

  // المتغير اللي هيشيل داتا الحجز
  resData: ReservationData | null = null;

  // متغير وهمي لعرض الـ Deadline من الباك إند (Mock)
  backendDeadline = 'Friday, May 15, 2026 - 11:59 PM';

  constructor() {} // constructor(private resService: ReservationService) {}

  ngOnInit(): void {
    this.fetchReservationDetails();
  }

  fetchReservationDetails() {
    // 💡 هنا هتحط كود الـ API من الباك إند
    // كمثال:
    // this.resService.getDeadline().subscribe({
    //   next: (data) => {
    //     this.resData = data;
    //   },
    //   error: (err) => console.error('Error fetching reservation', err)
    // });

    // حالياً هنستخدم البيانات الوهمية
    this.resData = {
      id: 1,
      deadlineDate: '2026-05-15T23:59:00'
    };
  }

  onRegister() {
    // كود الحجز هنا
    alert('Redirecting to registration form...');
  }

  onAddToCalendar() {
    // كود إضافة للكليندر هنا
    alert('Opening calendar integrated application...');
  }
}
