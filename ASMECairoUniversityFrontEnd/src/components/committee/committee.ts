import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as AOS from 'aos';
import { ContentService } from '../../app/core/services/content.service';

interface SubTeamVM {
  name: string;
  icon: string;
  description: string;
}

/** A committee plus the client-only UI state (isExpanded) that content.json doesn't need to know about. */
interface CommitteeVM {
  title: string;
  icon: string;
  borderColor: string;
  isExpanded: boolean;
  subTeams: SubTeamVM[];
}

@Component({
  selector: 'app-committee',
  imports: [CommonModule, RouterModule],
  templateUrl: './committee.html',
  styleUrl: './committee.css',
})
export class Committee implements OnInit {
  subtitle = '';
  title = '';

  /** Variable length — driven entirely by content.json's `committee.committees` array. */
  committees: CommitteeVM[] = [];

  loaded = false;

  /** Sub-team currently shown in the popup, or null when the popup is closed. */
  selectedSubTeam: SubTeamVM | null = null;

  constructor(
    private contentService: ContentService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    AOS.init();

    this.contentService.getContent().subscribe((data) => {
      this.subtitle = data.committee.subtitle;
      this.title = data.committee.title;
      this.committees = data.committee.committees.map((c) => ({ ...c, isExpanded: false }));
      this.loaded = true;
      // Cards are rendered via *ngFor once content arrives, so AOS needs to
      // re-scan the DOM for the data-aos elements that just appeared.
      this.cdr.detectChanges();
      AOS.refreshHard();
    });
  }

  toggleCommittee(index: number) {
    this.committees[index].isExpanded = !this.committees[index].isExpanded;
  }

  openTeamModal(sub: SubTeamVM, event: MouseEvent) {
    event.stopPropagation();
    this.selectedSubTeam = sub;
  }

  closeTeamModal() {
    this.selectedSubTeam = null;
  }
}