import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-details.html',
  styleUrls: ['./event-details.css']
})
export class EventDetailsComponent implements OnInit {

  // داتا الحدث (Mock Data) مطابقة للتصميم بتاعك
  eventInfo = {
    date: 'Monday, April 28, 2025',
    time: '3:00 PM - 6:00 PM',
    venue: 'Faculty of Engineering, Hall A',
    location: 'Cairo University, Giza',
    organizedBy: 'Events Committee',
    totalCapacity: 80,
    remainingSeats: 43,
    registrationDeadline: 'April 25, 2025'
  };

  constructor() {}

  ngOnInit(): void {}

  // دالة لنسخ رابط الصفحة
  copyLink() {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      alert('Link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }
}
