import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
// تأكد أن المسار صحيح لـ ApiService بتاعتك
//import { ApiService } from '../../path/to/your/api.service';

@Injectable({
  providedIn: 'root' // هذا يجعل السيرفيس Singleton في التطبيق كله
})
export class SponsorsService {
    //private apiService: ApiService
  constructor() { }

  // الدالة المسؤولة عن جلب الـ Sponsors فقط


/*  getSponsors(): Observable<any> {
    // نفترض إن الـ endpoint اسمه 'sponsors' أو حسب اللي عندك في الباك
    return this.apiService.getService('sponsors'); }
  */



}
