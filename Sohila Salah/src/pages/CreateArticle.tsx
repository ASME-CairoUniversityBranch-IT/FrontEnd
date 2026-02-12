import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import Navbar from "@/components/Navbar";
import { addArticle } from "@/lib/articles";

const categories = ["World News", "Technology", "Design", "Finance", "Travel", "Culture", "Sustainability", "Science"];

const CreateArticle = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Technology");
  const [seoDescription, setSeoDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    const newArticle = addArticle({
      title,
      subtitle: seoDescription || body.slice(0, 120) + "...",
      body,
      category,
      image: imagePreview || "",
      author: "You",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      readTime: `${Math.max(1, Math.ceil(body.split(/\s+/).length / 200))} min read`,
      seoDescription,
    });

    navigate(`/article/${newArticle.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <form onSubmit={handleSubmit} className="mx-auto grid max-w-[1100px] gap-10 px-5 py-10 lg:grid-cols-[3fr_1fr]">
        {/* Main Editor */}
        <div className="rounded-lg bg-card p-6 shadow-sm md:p-10">
          {/* Image Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`mb-8 cursor-pointer rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
              imagePreview
                ? "border-accent"
                : "border-border text-muted-foreground hover:border-accent hover:text-accent"
            }`}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Cover" className="mx-auto max-h-64 rounded-lg object-cover" />
            ) : (
              <>
                <Upload className="mx-auto mb-2 h-8 w-8" />
                <p className="font-semibold">Add Cover Image</p>
                <p className="text-sm">Drag and drop or click to upload</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article Title Here..."
            className="mb-5 w-full border-none bg-transparent font-serif text-3xl font-extrabold text-foreground outline-none placeholder:text-muted-foreground/40 md:text-4xl"
            required
          />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Tell your story..."
            className="min-h-[400px] w-full resize-y border-none bg-transparent text-lg leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/40"
            required
          />
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-5">
          <div className="rounded-lg bg-card p-5 shadow-sm">
            <button
              type="submit"
              className="w-full rounded-md bg-accent py-4 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Publish Article
            </button>
          </div>

          <div className="rounded-lg bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Categories
            </h3>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="rounded-lg bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              SEO Description
            </h3>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={4}
              placeholder="Short description for search engines..."
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-accent"
            />
          </div>
        </aside>
      </form>
    </div>
  );
};

export default CreateArticle;
