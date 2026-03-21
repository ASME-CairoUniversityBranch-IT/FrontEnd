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
      "icons/icons8-facebook-logo-50.png",
      "icons/instagram-logo.png",
      "icons/icons8-linkedin-50.png",
    ];
  }
}
