import { Link } from "react-router-dom";
import { Search } from "lucide-react";

const categories = ["World", "Business", "Tech", "Science", "Design"];

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card px-4 py-4 md:px-8">
      <Link to="/" className="font-serif text-xl font-black tracking-tight md:text-2xl">
        THE DAILY GRID.
      </Link>
      <ul className="hidden gap-8 md:flex">
        {categories.map((cat) => (
          <li key={cat}>
            <span className="cursor-pointer text-sm font-medium uppercase text-muted-foreground transition-colors hover:text-foreground">
              {cat}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3">
        <button className="text-muted-foreground transition-colors hover:text-foreground">
          <Search className="h-5 w-5" />
        </button>
        <Link
          to="/create"
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Write
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
