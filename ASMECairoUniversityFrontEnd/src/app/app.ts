import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ContactUs } from '../components/contact-us/contact-us';

@Component({
  selector: 'app-root',
  imports: [ ContactUs, RouterOutlet ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ASMECairoUniversityFrontEnd');
}
