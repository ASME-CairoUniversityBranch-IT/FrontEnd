import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as AOS from 'aos';
@Component({
  selector: 'app-our-project',
  imports: [CommonModule, RouterModule,],
  templateUrl: './our-projects.html',
  styleUrl: './our-projects.css',
})
export class OurProject implements OnInit {

ngOnInit() {
  AOS.init();
}



  projectsData = [
    {
      icon: '🚀',
      title: 'Spring Opening Ceremony',
      description: 'Kicking off the new semester with guest speakers, team showcases, and networking with industry professionals.',
      date: '📅 March 1, 2026'
    },
    {
      icon: '🏁',
      title: 'ASME E-Fest Competition',
      description: 'Regional competition where our HPV and HPVC teams compete in endurance, speed, and design events.',
      date: '📅 April 2026'
    },
    {
      icon: '💡',
      title: 'Innovation Day',
      description: 'Annual exhibition where teams present their year-long projects to judges, faculty, and industry guests.',
      date: '📅 May 2026'
    }
  ];

}



