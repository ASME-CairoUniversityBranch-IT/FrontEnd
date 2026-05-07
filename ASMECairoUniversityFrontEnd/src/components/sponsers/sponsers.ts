import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// لو عامل Service بتكلم الباك إند هتعملها Import هنا
// import { ApiService } from '../../services/api.service';

export interface Sponsor {
  id: number;
  name: string;
  logoUrl?: string;
}

export interface SponsorCategory {
  categoryName: string;
  sponsors: Sponsor[];
}

@Component({
  selector: 'app-sponsers',
  imports: [CommonModule],
  templateUrl: './sponsers.html',
  styleUrls: ['./sponsers.css']
})
export class SponsersComponent implements OnInit {

  categoriesData: SponsorCategory[] = [];

  // هنا بنعمل Inject للـ Service اللي بتكلم الـ API (لو موجودة)
  // constructor(private apiService: ApiService) {}
  constructor() {}

  ngOnInit(): void {
    this.loadSponsorsFromBackend();
  }

  loadSponsorsFromBackend() {
    // 💡 هنا المفروض تحط الكود اللي بيكلم الباك إند
    // كمثال لو عندك Service:
    // this.apiService.getSponsors().subscribe({
    //   next: (data) => {
    //     this.categoriesData = data;
    //   },
    //   error: (err) => {
    //     console.error('Error fetching sponsors', err);
    //   }
    // });
  }
}
