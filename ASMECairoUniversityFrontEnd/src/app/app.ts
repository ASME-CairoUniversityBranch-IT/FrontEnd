import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ContactUs } from '../components/contact-us/contact-us';
import { Committee } from '../components/committee/committee';
import { OurProject } from '../components/our-projects/our-projects';
import { AboutAsme } from '../components/about-asme/about-asme';
import { MainFooter } from '../components/main-footer/main-footer';
import { OurValues } from '../components/our-values/our-values';

@Component({
  selector: 'app-root',
  imports: [ContactUs, RouterOutlet, OurProject, Committee, AboutAsme, MainFooter, OurValues],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ASMECairoUniversityFrontEnd');
}
