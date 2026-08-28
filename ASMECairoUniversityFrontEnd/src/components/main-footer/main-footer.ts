import { Component } from '@angular/core';

@Component({
  selector: 'app-main-footer',
  templateUrl: './main-footer.html',
  styleUrl: './main-footer.css',
})
export class MainFooter {

  imageIcons: {
    icon: string;
    link: string;
    name: string;
  }[];

  constructor() {
    this.imageIcons = [
      {
        icon: 'icons/icons8-facebook-logo-50.png',
        link: 'https://www.facebook.com/share/1D14yes9jK/',
        name: 'Facebook'
      },
      {
        icon: 'icons/instagram-logo.png',
        link: 'https://www.instagram.com/asme_cairo?igsh=aXBlbzhjdW9m',
        name: 'Instagram'
      },
      {
        icon: 'icons/icons8-linkedin-50.png',
        link: 'https://www.linkedin.com/company/asme-cairo-university/',
        name: 'LinkedIn'
      }
    ];
  }
}
