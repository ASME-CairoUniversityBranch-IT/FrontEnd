import { Link } from "react-router-dom";
import type { Article } from "@/lib/articles";

const ArticleCard = ({ article }: { article: Article }) => {
  return (
    <Link to={`/article/${article.id}`} className="group block">
      <article className="flex h-full flex-col overflow-hidden rounded-lg bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        <img
          src={article.image}
          alt={article.title}
          className="aspect-video w-full bg-muted object-cover"
        />
        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-2 font-serif text-xl leading-snug text-card-foreground transition-colors group-hover:text-accent">
            {article.title}
          </h3>
          <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">
            {article.subtitle}
          </p>
          <div className="flex items-center justify-between border-t border-border pt-4 text-xs font-medium text-muted-foreground">
            <span>{article.category}</span>
            <span>{article.readTime}</span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ArticleCard;
