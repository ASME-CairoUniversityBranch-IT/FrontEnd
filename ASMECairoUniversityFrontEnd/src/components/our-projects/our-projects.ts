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


activeTab: 'EVENTS' | 'WORKSHOPS' | 'FIELD TRIPS' = 'EVENTS';
allProjects = [
  {
    tab: 'EVENTS',
    icon: '🚀',
    title: 'Spring Opening Ceremony',
    description: 'Kicking off the new semester with guest speakers, team showcases, and networking with industry professionals.',
    date: '📅 March 1, 2026'
  },
  {
    tab: 'EVENTS',
    icon: '🏁',
    title: 'ASME E-Fest Competition',
    description: 'Regional competition where our HPV and HPVC teams compete in endurance, speed, and design events.',
    date: '📅 April 2026'
  },
  {
    tab: 'EVENTS',
    icon: '💡',
    title: 'Innovation Day',
    description: 'Annual exhibition where teams present their year-long projects to judges, faculty, and industry guests.',
    date: '📅 May 2026'
  },
  // add WORKSHOPS and FIELD TRIPS entries here the same way
];

get projectsData() {
  return this.allProjects.filter(p => p.tab === this.activeTab);
}

switchTab(tab: 'EVENTS' | 'WORKSHOPS' | 'FIELD TRIPS'): void {
  this.activeTab = tab;
}

}



