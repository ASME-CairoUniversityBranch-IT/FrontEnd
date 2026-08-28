import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sponsor, SponsorshipTier } from '../../../core/models/project.model';

interface SponsorGroup { tierName: string; sponsors: Sponsor[]; }

const TIER_LABEL: Record<SponsorshipTier, string> = {
  [SponsorshipTier.Strategic]: 'Strategic',
  [SponsorshipTier.Platinum]: 'Platinum',
  [SponsorshipTier.Gold]: 'Gold',
  [SponsorshipTier.Silver]: 'Silver',
  [SponsorshipTier.Bronze]: 'Bronze',
};
// Keep the public-facing ladder aligned with the visual hierarchy. Strategic
// is a legacy API tier and stays available after the commercial tiers.
const TIER_ORDER = [SponsorshipTier.Platinum, SponsorshipTier.Gold, SponsorshipTier.Silver, SponsorshipTier.Bronze, SponsorshipTier.Strategic];

@Component({
  selector: 'app-sponsers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sponsers.html',
  styleUrls: ['./sponsers.css'],
})
export class SponsersComponent {
  groups: SponsorGroup[] = [];

  /** The API returns a flat list with a numeric tier per sponsor — grouped here for display,
   *  same visual layout the team originally designed around grouped tiers. */
  @Input() set sponsors(list: Sponsor[] | null | undefined) {
    const byTier = new Map<SponsorshipTier, Sponsor[]>();
    for (const s of list ?? []) {
      if (!byTier.has(s.sponsorshipTier)) byTier.set(s.sponsorshipTier, []);
      byTier.get(s.sponsorshipTier)!.push(s);
    }
    this.groups = TIER_ORDER
      .filter(t => byTier.has(t))
      .map(t => ({ tierName: TIER_LABEL[t], sponsors: byTier.get(t)! }));
  }
}
