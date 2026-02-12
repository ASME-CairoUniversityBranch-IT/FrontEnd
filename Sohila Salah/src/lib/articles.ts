import article1 from "@/assets/article-1.jpg";
import article2 from "@/assets/article-2.jpg";
import article3 from "@/assets/article-3.jpg";
import article4 from "@/assets/article-4.jpg";
import article5 from "@/assets/article-5.jpg";
import article6 from "@/assets/article-6.jpg";

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  category: string;
  image: string;
  author: string;
  date: string;
  readTime: string;
  seoDescription?: string;
}

const initialArticles: Article[] = [
  {
    id: "1",
    title: "Markets Rally as Inflation Cools Down",
    subtitle: "Investors are optimistic as the latest consumer price index reports lower than expected numbers for the third quarter.",
    body: `In the rolling hills of global finance, a quiet transformation is taking place. Markets have surged following the latest inflation data, which showed a cooling trend that has eased investor anxieties.\n\nThe implications are massive. For months, central banks worldwide have been walking a tightrope between controlling inflation and maintaining economic growth. The latest data suggests their policies may finally be bearing fruit.\n\n"We used to watch every tick of the inflation gauge with dread. Now, there's cautious optimism in the air," said market analyst Sarah Chen.\n\nBond yields have responded favorably, dropping to levels not seen since early last year. This shift has particularly benefited technology stocks, which tend to thrive in lower interest rate environments.\n\nHowever, economists caution against premature celebration. Supply chain disruptions and geopolitical tensions could still reignite inflationary pressures. The road to price stability remains long and uncertain.`,
    category: "Finance",
    image: article1,
    author: "Michael Chen",
    date: "Feb 8, 2026",
    readTime: "4 min read",
  },
  {
    id: "2",
    title: "The Evolution of Minimalist Architecture",
    subtitle: "Why top designers are moving away from brutalism and embracing organic materials in urban spaces.",
    body: `Architecture is experiencing a renaissance. The cold concrete facades that dominated urban landscapes for decades are giving way to warmer, more organic designs that prioritize human comfort and environmental harmony.\n\nLeading architects are incorporating natural materials like cross-laminated timber, rammed earth, and living walls into their designs. These materials don't just look beautiful—they actively contribute to better air quality and reduced carbon footprints.\n\n"The best building is one that feels like it grew from the earth rather than being imposed upon it," explains renowned architect Maria Torres.\n\nThis shift reflects a broader cultural movement toward sustainability and well-being. Cities like Copenhagen, Singapore, and Melbourne are leading the charge with ambitious green building codes.\n\nThe results are striking: buildings that breathe, adapt to seasons, and create spaces where people genuinely want to spend time.`,
    category: "Design",
    image: article2,
    author: "Sarah Williams",
    date: "Feb 7, 2026",
    readTime: "6 min read",
  },
  {
    id: "3",
    title: "Electric Aviation: A Reality Check",
    subtitle: "Battery density remains a hurdle, but short-haul flights might be closer than we think.",
    body: `The dream of electric flight is inching closer to reality, but significant challenges remain. Current battery technology can power short hops of up to 200 miles, but the energy density needed for longer routes remains elusive.\n\nSeveral startups are making promising strides. Companies like Heart Aerospace and Eviation are developing regional electric aircraft that could enter service within the next few years.\n\n"We're not trying to replace the 787. We're targeting the routes where a 19-seat electric plane makes perfect economic and environmental sense," says Heart Aerospace CEO Anders Forslund.\n\nThe economics are compelling: electric motors require far less maintenance than jet engines, and electricity costs a fraction of jet fuel. For routes under 300 miles, the math already works.\n\nRegulatory frameworks are evolving too. The FAA and EASA are developing new certification pathways specifically designed for electric aircraft, clearing bureaucratic hurdles that once seemed insurmountable.`,
    category: "Tech",
    image: article3,
    author: "James Morton",
    date: "Feb 6, 2026",
    readTime: "5 min read",
  },
  {
    id: "4",
    title: "Hidden Gems of the Mediterranean",
    subtitle: "Forget Santorini. Here are five islands untouched by mass tourism that you can visit this summer.",
    body: `While millions flock to the well-trodden paths of Mykonos and Amalfi, a handful of Mediterranean islands remain blissfully untouched. These hidden gems offer the crystal-clear waters and sun-drenched charm of their famous neighbors, without the crowds.\n\nFolegandros, Greece, sits just west of Santorini but feels like a different world. Its clifftop village, Chora, offers whitewashed simplicity and views that rival any Instagram hotspot.\n\n"The magic of these places is that they haven't been optimized for tourism. You eat where the locals eat, swim where they swim," says travel writer Elena Rossi.\n\nVis, Croatia, once a military base closed to foreigners until 1989, has preserved an authenticity that's vanishingly rare in the Adriatic. Its Blue Cave rivals Capri's, but without the three-hour queue.\n\nThese islands remind us what Mediterranean travel used to be: unhurried, genuine, and full of surprise.`,
    category: "Travel",
    image: article4,
    author: "Elena Rossi",
    date: "Feb 5, 2026",
    readTime: "8 min read",
  },
  {
    id: "5",
    title: "Cinema's New Golden Age",
    subtitle: "Independent filmmakers are utilizing streaming platforms to reach wider audiences than ever before.",
    body: `We are living through a golden age of independent cinema. Streaming platforms have democratized distribution, allowing filmmakers who once struggled to find theaters to reach millions of viewers worldwide.\n\nThe numbers tell the story: independent film production has increased by 40% over the past three years, driven by lower barriers to entry and hungry audiences seeking alternatives to franchise fatigue.\n\n"For the first time in history, a filmmaker in Lagos can have the same reach as one in Los Angeles," observes film critic David Ehrlich.\n\nThis democratization hasn't come without challenges. The sheer volume of content makes discovery difficult, and many independent films still struggle to find their audience in an ocean of choices.\n\nYet the creative output is undeniable. Recent festival circuits have showcased bold, innovative storytelling from regions previously underrepresented in global cinema.`,
    category: "Culture",
    image: article5,
    author: "David Park",
    date: "Feb 4, 2026",
    readTime: "7 min read",
  },
  {
    id: "6",
    title: "Urban Farming in Mega Cities",
    subtitle: "How skyscrapers are being converted into vertical farms to feed the growing population.",
    body: `In the heart of Singapore, a 30-story building produces enough leafy greens to feed 10,000 people. Welcome to the future of urban agriculture.\n\nVertical farming is no longer a concept—it's a thriving industry projected to reach $20 billion by 2028. These indoor farms use 95% less water than traditional agriculture and can produce crops year-round, regardless of weather.\n\n"We're not competing with traditional farmers. We're complementing them by growing what makes sense in urban environments," explains Sky Greens founder Jack Ng.\n\nThe technology stack is impressive: LED lights tuned to specific wavelengths, AI-controlled nutrient delivery systems, and robotic harvesting that operates around the clock.\n\nCritics argue that vertical farms consume too much energy, but proponents counter that when powered by renewable sources, the total environmental footprint is dramatically lower than conventional farming plus transportation.`,
    category: "Sustainability",
    image: article6,
    author: "Lisa Chang",
    date: "Feb 3, 2026",
    readTime: "3 min read",
  },
];

let articles: Article[] = [...initialArticles];

export const getArticles = (): Article[] => articles;

export const getArticleById = (id: string): Article | undefined =>
  articles.find((a) => a.id === id);

export const addArticle = (article: Omit<Article, "id">): Article => {
  const newArticle: Article = {
    ...article,
    id: Date.now().toString(),
  };
  articles = [newArticle, ...articles];
  return newArticle;
};
