import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as AOS from 'aos';

@Component({
  selector: 'app-committee',
  imports: [CommonModule, RouterModule,],
  templateUrl: './committee.html',
  styleUrl: './committee.css',
})
export class Committee implements OnInit {
ngOnInit() {
  AOS.init();
}


  committees = [
    {
      title: 'OPERATIONS',
      icon: '⚙️',
      borderColor: '#1e3a8a',
      isExpanded: false,
      subTeams: [
        { name: 'EXTERNAL RELATIONS', icon: '🤝' },
        { name: 'OC & LOGISTICS', icon: '📦' }
      ]
    },
    {
      title: 'QUALITY',
      icon: '🔬',
      borderColor: '#10b981',
      isExpanded: false,
      subTeams: [
        { name: 'EVALUATION', icon: '📊' },
        { name: 'MONITORING', icon: '👁️' }
      ]
    },
    {
      title: 'BRANDING',
      icon: '📣',
      borderColor: '#ef4444',
      isExpanded: false,
      subTeams: [
        { name: 'SOCIAL MEDIA', icon: '📱' },
        { name: 'DESIGN', icon: '🎨' }
      ]
    }
  ];


  toggleCommittee(index: number) {
    this.committees[index].isExpanded = !this.committees[index].isExpanded;
  }
}
