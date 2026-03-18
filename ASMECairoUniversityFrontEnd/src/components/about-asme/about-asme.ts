import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import AOS from 'aos';

@Component({
  selector: 'app-about-asme',
  imports: [CommonModule, RouterModule, ],
  templateUrl: './about-asme.html',
  styleUrl: './about-asme.css',
})
export class AboutAsme implements OnInit {
ngOnInit() {
  AOS.init();
}


  cardsData = [
    {
      icon: '🌐',
      title: 'GLOBAL VISION',
      description: 'ASME\'s vision is to be the essential resource for mechanical engineers and other technical professionals worldwide to develop their skills, knowledge, and professional practices across emerging and traditional engineering frontiers.'
    },
    {
      icon: '🎯',
      title: 'OUR BRANCH MISSION',
      description: 'Empowering engineering students with hands-on learning, industry exposure, and leadership development to connect academia with the real world.'
    },
    {
      icon: '⭐',
      title: 'BRANCH VISION',
      description: 'To be a top student organization promoting innovation, technical excellence, and leadership for future professionals.'
    }
  ];

}
