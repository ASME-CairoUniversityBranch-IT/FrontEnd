import { Component } from '@angular/core';
import { ContactUs } from '../contact-us/contact-us';
import { Committee } from '../committee/committee';
import { OurProject } from '../our-projects/our-projects';
import { AboutAsme } from '../about-asme/about-asme';
import { MainFooter } from '../main-footer/main-footer';
import { OurValues } from '../our-values/our-values';
import { Navbar } from '../navbar/navbar';
import { ActivitiesAchievements } from '../activities-achievements/activities-achievements';
import { MainBanner } from '../main-banner/main-banner';
import { EventsPageComponent } from '../projectss-page/events-page';
import { CreateEventComponent } from "../create-event/create-event";

@Component({
  selector: 'app-home-page',
  imports: [ContactUs, OurProject, Committee, AboutAsme, MainFooter, OurValues, Navbar, ActivitiesAchievements, MainBanner, CreateEventComponent, EventsPageComponent],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {

}
