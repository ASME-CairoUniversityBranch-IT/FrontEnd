import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-main-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-footer.html',
  styleUrl: './main-footer.css',
})
export class MainFooter {
  readonly imageIcons: {
    icon: string;
    link: string;
    name: string;
  }[] = [
    {
      icon: 'icons/icons8-facebook-logo-50.png',
      link: 'https://www.facebook.com/share/1D14yes9jK/',
      name: 'Facebook',
    },
    {
      icon: 'icons/instagram-logo.png',
      link: 'https://www.instagram.com/asme_cairo?igsh=aXBlbzhjdW9m',
      name: 'Instagram',
    },
    {
      icon: 'icons/icons8-linkedin-50.png',
      link: 'https://www.linkedin.com/company/asme-cairo-university/',
      name: 'LinkedIn',
    },
  ];
}
