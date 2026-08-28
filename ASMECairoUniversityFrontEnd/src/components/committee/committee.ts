import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ContentService } from '../../app/core/services/content.service';

export interface SubTeamWithIcon {
  name: string;
  description: string;
  icon: string;
}

export interface EnrichedCommittee {
  title: string;
  index: number;
  borderColor: string;
  subTeams: SubTeamWithIcon[];
}

@Component({
  selector: 'app-committee',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './committee.html',
  styleUrl: './committee.css',
})
export class Committee implements OnInit {
  subtitle = '';
  title = '';
  committees: EnrichedCommittee[] = [];
  selectedCommitteeIndex = 0;
  loaded = false;

  private iconMap: Record<string, string> = {
    'external relations': 'fa-solid fa-handshake',
    'oc & logistics': 'fa-solid fa-boxes-packing',
    'hr': 'fa-solid fa-users-gear',
    'supply chain': 'fa-solid fa-network-wired',
    'it': 'fa-solid fa-laptop-code',
    'photography & videography': 'fa-solid fa-camera-retro',
    'graphic design': 'fa-solid fa-palette',
    'marketing': 'fa-solid fa-bullhorn',
  };

  constructor(
    private contentService: ContentService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.contentService.getContent().subscribe((data) => {
      this.subtitle = data.committee.subtitle;
      this.title = data.committee.title;
      this.committees = data.committee.committees.map((c, cIndex) => ({
        title: c.title,
        index: cIndex,
        borderColor: c.borderColor,
        subTeams: c.subTeams.map((sub) => {
          const key = sub.name.trim().toLowerCase();
          return {
            name: sub.name,
            description: sub.description,
            icon: this.iconMap[key] || 'fa-solid fa-gear',
          };
        }),
      }));

      this.loaded = true;
      this.cdr.detectChanges();
    });
  }

  selectCommittee(index: number): void {
    this.selectedCommitteeIndex = index;
  }

  get activeCommittee(): EnrichedCommittee | undefined {
    return this.committees[this.selectedCommitteeIndex];
  }
}
