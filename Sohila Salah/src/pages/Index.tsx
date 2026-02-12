import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import ArticleCard from "@/components/ArticleCard";
import { getArticles, type Article } from "@/lib/articles";

const Index = () => {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    setArticles(getArticles());
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroCarousel />

      <section className="mx-auto max-w-[1200px] px-5 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="border-l-4 border-accent pl-4 text-2xl font-extrabold text-foreground">
            Latest Stories
          </h2>
          <span className="text-sm font-medium text-accent">View All →</span>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
