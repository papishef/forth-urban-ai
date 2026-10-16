import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Calendar, ArrowRight, Tag, BookOpen } from "lucide-react";
import { BuildingLoader, Button } from "@forth-urban/ui";
import { useBlogPosts } from "../marketing-api";
import { useSeo } from "../../../lib/use-seo";
import { useAuth } from "../../../lib/auth-context";
import { resolveEngineCta } from "../../../lib/engine-cta";

const CATEGORIES = [
  "All",
  "Market Insights",
  "Investment Guides",
  "Legal & Due Diligence",
  "Company News",
  "Area Spotlights",
];

export function BlogListPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);
  const { user, isAuthenticated } = useAuth();

  useSeo({
    title: "Market Insights, Investment Guides & Real Estate News",
    description:
      "Expert articles, Abuja real estate price trends, legal title due diligence, and strategic property advisory from the Forth Urban team.",
  });

  const categoryQuery = selectedCategory === "All" ? undefined : selectedCategory;
  const { data, isLoading } = useBlogPosts(page, categoryQuery);

  const quizCta = resolveEngineCta(user, isAuthenticated, "quiz");

  return (
    <div className="relative overflow-hidden py-16 sm:py-24">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#5C4033]/10 px-4 py-1.5 text-xs font-bold text-[#5C4033] uppercase tracking-wider mb-4">
          <BookOpen className="h-4 w-4" />
          Forth Urban Knowledge Hub
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-[#181818] tracking-tight">
          Market Insights & Real Estate Guides
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-[#181818]/75 leading-relaxed">
          Stay informed on Abuja property appreciation trends, infrastructure corridors, AGIS title verification, and smart land investing.
        </p>

        {/* Category Filter Pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-[#5C4033] text-white shadow-md"
                    : "bg-white/60 text-[#181818]/75 hover:bg-white hover:text-[#5C4033] border border-white/80"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <BuildingLoader size="lg" label="Loading latest insights…" className="py-20" />
        ) : !data || data.items.length === 0 ? (
          <div className="rounded-3xl liquid-glass p-12 text-center max-w-lg mx-auto">
            <BookOpen className="h-12 w-12 text-[#5C4033]/50 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold text-[#181818] mb-2">
              No Articles in this Category Yet
            </h3>
            <p className="text-sm text-[#181818]/70 mb-6">
              Our market advisory team publishes new analyses regularly. Please check back soon or browse all categories.
            </p>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setSelectedCategory("All")}
            >
              Show All Articles
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.items.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group rounded-3xl liquid-glass overflow-hidden flex flex-col justify-between transition hover:-translate-y-2 duration-300 hover:shadow-2xl border-white/80"
              >
                <div>
                  {post.coverImageUrl ? (
                    <div className="h-52 w-full overflow-hidden bg-[#5C4033]">
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="h-52 w-full bg-gradient-to-br from-[#5C4033] to-[#2c1d17] p-6 flex items-end">
                      <span className="font-heading font-black text-white/30 text-4xl">FU</span>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#5C4033]/10 px-3 py-0.5 text-xs font-bold text-[#5C4033]">
                        <Tag className="h-3 w-3" />
                        {post.category}
                      </span>
                    </div>

                    <h2 className="font-heading text-xl font-bold text-[#181818] group-hover:text-[#5C4033] transition line-clamp-2 mb-3 leading-snug">
                      {post.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-[#181818]/70 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <div className="flex items-center justify-between border-t border-[#5C4033]/10 pt-4 text-xs text-[#181818]/60">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Published"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-[#5C4033] group-hover:text-[#d4af37] transition">
                      <span>Read Full</span>
                      <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination if total exceeds limit */}
        {data && data.total > 9 && (
          <div className="mt-12 flex justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-xs font-semibold text-[#181818]/70">
              Page {data.page} of {Math.ceil(data.total / 9)}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page * 9 >= data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}

        {/* In-feed CTA banner */}
        <div className="mt-24 rounded-3xl liquid-glass-card p-8 sm:p-12 text-center">
          <div className="max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5C4033]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#5C4033] mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Empower Your Decisions
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#181818]">
              Want personalized land recommendations for your budget?
            </h2>
            <p className="mt-3 text-sm text-[#181818]/70 leading-relaxed">
              Our AI engine matches your specific buying readiness and preferences with verified serviced plots across Abuja.
            </p>
            <div className="mt-6">
              <Link to={quizCta.to}>
                <Button variant="premium" size="lg" className="rounded-full gap-2 shadow-lg">
                  <Sparkles className="h-4 w-4" />
                  <span>{quizCta.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
