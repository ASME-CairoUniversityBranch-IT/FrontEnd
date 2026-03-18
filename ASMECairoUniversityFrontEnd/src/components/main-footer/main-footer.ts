import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-main-footer',
  imports: [RouterLink],
  templateUrl: './main-footer.html',
  styleUrl: './main-footer.css',
})
export class MainFooter {
  imageIcons: string[];
  constructor() {
    this.imageIcons = [
      "https://img.icons8.com/color/48/email.png",
      "https://img.icons8.com/3d-fluency/94/facebook-logo.png",
      "https://img.icons8.com/3d-fluency/94/instagram-logo.png",
      "https://img.icons8.com/color/48/linkedin.png",
    ];
  }
}
