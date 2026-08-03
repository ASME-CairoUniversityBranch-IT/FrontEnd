/**
 * Shape of `public/content.json` — the single file a non-developer edits to change
 * every piece of static (non-backend) copy on the main page.
 *
 * Every list here (`stats`, `cards`, `slides`, `achievements`, `committees`,
 * `subTeams`, `organizationParagraphs`) is read with `*ngFor`, so it can contain
 * any number of entries — zero, one, or as many as you like. There is no hardcoded
 * limit anywhere in the components; just add or remove objects from the arrays in
 * content.json and the page will follow.
 */

export interface HeroCta {
  label: string;
  href: string;
}

export interface HeroStat {
  /** The number the counter animates up to, e.g. 500 */
  target: number;
  /** Shown right after the number, e.g. "+". Use "" for none. */
  suffix: string;
  label: string;
}

export interface MainBannerContent {
  badge: string;
  /** Each entry renders on its own line in the big hero title. */
  titleLines: string[];
  subtitle: string;
  ctaPrimary: HeroCta;
  ctaSecondary: HeroCta;
  stats: HeroStat[];
}

export interface AboutAsmeCard {
  /** A single emoji or short icon glyph. */
  icon: string;
  title: string;
  description: string;
}

export interface AboutAsmeContent {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  organizationTitle: string;
  /** One paragraph per entry — add as many as you need. */
  organizationParagraphs: string[];
  cards: AboutAsmeCard[];
}

export interface ValueCard {
  tag: string;
  title: string;
  overlayBody1: string;
  overlayBody2: string;
}

export interface OurValuesContent {
  sectionLabel: string;
  sectionTitle: string;
  cards: ValueCard[];
}

export interface ActivitySlide {
  tag: string;
  title: string;
  desc: string;
  /** CSS background value, e.g. a linear-gradient(...) string. */
  bg: string;
  /** Raw decorative SVG markup rendered behind the slide text. */
  decoSvg: string;
}

export interface AchievementItem {
  title: string;
  desc: string;
}

export interface ActivitiesAchievementsContent {
  featuredHighlightsLabel: string;
  slides: ActivitySlide[];
  achievementsEyebrow: string;
  achievementsTitle: string;
  achievements: AchievementItem[];
}

export interface SubTeam {
  name: string;
  icon: string;
}

export interface CommitteeItem {
  title: string;
  icon: string;
  /** Hex color for the card's left border accent, e.g. "#1e3a8a". */
  borderColor: string;
  subTeams: SubTeam[];
}

export interface CommitteeContent {
  subtitle: string;
  title: string;
  committees: CommitteeItem[];
}

export interface SiteContent {
  mainBanner: MainBannerContent;
  aboutAsme: AboutAsmeContent;
  ourValues: OurValuesContent;
  activitiesAchievements: ActivitiesAchievementsContent;
  committee: CommitteeContent;
}
