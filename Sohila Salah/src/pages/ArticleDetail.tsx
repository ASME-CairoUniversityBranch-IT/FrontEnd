import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { getArticleById, type Article } from "@/lib/articles";

const ArticleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (id) {
      const found = getArticleById(id);
      if (found) setArticle(found);
      else navigate("/");
    }
  }, [id, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!article) return null;

  const paragraphs = article.body.split("\n\n");

  return (
    <div className="min-h-screen bg-card">
      {/* Progress bar */}
      <div className="fixed left-0 top-0 z-[2000] h-1 w-full">
        <div
          className="h-1 bg-accent transition-[width] duration-100"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Article navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card px-4 py-4 md:px-8">
        <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent">
          <ArrowLeft className="h-4 w-4" />
          Back to Feed
        </Link>
        <span className="font-serif text-xl font-black tracking-tight md:text-2xl">
          THE DAILY GRID.
        </span>
        <div className="w-20" />
      </nav>

      <div className="mx-auto max-w-[800px] px-5 py-16">
        <header className="mb-10 text-center">
          <span className="mb-4 inline-block text-sm font-bold uppercase tracking-widest text-accent">
            {article.category}
          </span>
          <h1 className="mb-6 font-serif text-3xl leading-tight text-foreground md:text-5xl">
            {article.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted font-serif text-lg font-bold text-foreground">
              {article.author.charAt(0)}
            </div>
            <div className="text-left">
              <div className="font-semibold text-foreground">{article.author}</div>
              <div className="text-sm">{article.date} • {article.readTime}</div>
            </div>
          </div>
        </header>

        <img
          src={article.image}
          alt={article.title}
          className="mb-12 max-h-[500px] w-full rounded-xl object-cover shadow-lg"
        />

        <article className="font-serif text-lg leading-[1.8] text-muted-foreground md:text-xl">
          {paragraphs.map((p, i) => {
            if (p.startsWith('"') || p.startsWith('"')) {
              return (
                <blockquote
                  key={i}
                  className="my-12 border-l-4 border-accent pl-8 text-xl italic text-foreground md:text-2xl"
                >
                  {p}
                </blockquote>
              );
            }
            return (
              <p key={i} className={`mb-8 ${i === 0 ? "drop-cap" : ""}`}>
                {p}
              </p>
            );
          })}
        </article>
      </div>
    </div>
  );
};

export default ArticleDetail;
