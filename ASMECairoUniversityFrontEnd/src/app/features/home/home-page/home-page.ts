import { Component } from '@angular/core';
import { ContactUs } from '../../../../components/contact-us/contact-us';
import { Committee } from '../../../../components/committee/committee';
import { OurProject } from '../../../../components/our-projects/our-projects';
import { AboutAsme } from '../../../../components/about-asme/about-asme';
import { OurValues } from '../../../../components/our-values/our-values';
import { ActivitiesAchievements } from '../../../../components/activities-achievements/activities-achievements';
import { MainBanner } from '../../../../components/main-banner/main-banner';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [ContactUs, OurProject, Committee, AboutAsme, OurValues, ActivitiesAchievements, MainBanner],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {}
