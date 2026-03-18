import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ContactUs } from '../components/contact-us/contact-us';
import { MainFooter } from "../components/main-footer/main-footer";
import {  OurValues } from "../components/our-values/our-values";


@Component({
  selector: 'app-root',
  imports: [ContactUs, MainFooter, OurValues],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ASMECairoUniversityFrontEnd');
}
