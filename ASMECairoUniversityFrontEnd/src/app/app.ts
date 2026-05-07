import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ContactUs } from '../components/contact-us/contact-us';
import { Committee } from '../components/committee/committee';
import { OurProject } from '../components/our-projects/our-projects';
import { AboutAsme } from '../components/about-asme/about-asme';
import { MainFooter } from '../components/main-footer/main-footer';
import { OurValues } from '../components/our-values/our-values';
import { Navbar } from '../components/navbar/navbar';
import { ActivitiesAchievements } from '../components/activities-achievements/activities-achievements';
import { MainBanner } from '../components/main-banner/main-banner';
<<<<<<< HEAD
import { EventsPageComponent } from '../components/projectss-page/events-page';
@Component({
  selector: 'app-root',
  imports: [ContactUs, RouterOutlet, OurProject, Committee, AboutAsme, MainFooter, OurValues, Navbar, ActivitiesAchievements, MainBanner, EventsPageComponent],
=======
import { CreateEventComponent } from "../components/create-event/create-event";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ContactUs, RouterOutlet, OurProject, Committee, AboutAsme, MainFooter, OurValues, Navbar, ActivitiesAchievements, MainBanner, CreateEventComponent],
>>>>>>> 5c8e2d1aaae277c4221440a74865a81052cf650a
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ASMECairoUniversityFrontEnd');
}
