import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core'; 
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

  imports: [
    CommonModule,
    RouterModule,
  ],

  templateUrl: './committee.html',

  styleUrl: './committee.css',
})
export class Committee implements OnInit {
  @ViewChild('committeeSection')
  committeeSection!: ElementRef<HTMLElement>;
  subtitle = '';

  title = '';

  committees: EnrichedCommittee[] = [];

  loaded = false;


  /*
   * Currently selected sub-team.
   *
   * null = no popup is open.
   */
  selectedSubTeam: SubTeamWithIcon | null = null;


  /*
   * Icon mapping
   */

  private iconMap: Record<string, string> = {

    'external relations':
      'fa-solid fa-handshake',

    'oc & logistics':
      'fa-solid fa-boxes-packing',

    'hr':
      'fa-solid fa-users-gear',

    'supply chain':
      'fa-solid fa-network-wired',

    'it':
      'fa-solid fa-laptop-code',

    'photography & videography':
      'fa-solid fa-camera-retro',

    'graphic design':
      'fa-solid fa-palette',

    'marketing':
      'fa-solid fa-bullhorn',
  };


  constructor(
    private contentService: ContentService,

    private cdr: ChangeDetectorRef,
  ) {}


  ngOnInit(): void {

    this.contentService
      .getContent()
      .subscribe((data) => {

        /*
         * Section content
         */

        this.subtitle =
          data.committee.subtitle;

        this.title =
          data.committee.title;


        /*
         * Committees
         */

        this.committees =
          data.committee.committees.map(
            (c, cIndex) => ({

              title: c.title,

              index: cIndex,

              borderColor:
                c.borderColor,

              subTeams:
                c.subTeams.map((sub) => {

                  const key =
                    sub.name
                      .trim()
                      .toLowerCase();


                  return {

                    name: sub.name,

                    description:
                      sub.description,

                    icon:
                      this.iconMap[key]
                      || 'fa-solid fa-gear',

                  };

                }),

            }),
          );


        this.loaded = true;

        this.cdr.detectChanges();

      });

  }


  /*
   * Open the popup for a sub-team.
   */

openSubTeam(team: SubTeamWithIcon): void {

  /*
   * Move the page to the committees section first.
   * This prevents the popup from appearing while
   * the user is scrolled down at another section.
   */
  this.committeeSection.nativeElement.scrollIntoView({
    behavior: 'auto',
    block: 'start',
  });

  /*
   * Open the popup.
   */
  this.selectedSubTeam = team;

  /*
   * Prevent the page underneath the popup from scrolling.
   */
  document.body.style.overflow = 'hidden';

}


  /*
   * Close the popup.
   */

closeSubTeam(): void {

  this.selectedSubTeam = null;

  /*
   * Restore page scrolling.
   */
  document.body.style.overflow = '';

}

@HostListener('document:keydown.escape')
onEscape(): void {

  if (this.selectedSubTeam) {
    this.closeSubTeam();
  }

}

}