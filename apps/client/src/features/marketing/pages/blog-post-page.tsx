import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  Tag,
  ArrowLeft,
  Sparkles,
  ArrowRight,
  Share2,
  Check,
  Building,
  User,
} from "lucide-react";
import { useState } from "react";
import { BuildingLoader, Button } from "@forth-urban/ui";
import { useBlogPost } from "../marketing-api";
import { useSeo } from "../../../lib/use-seo";
import { MarkdownRenderer } from "../../../components/markdown-renderer";
import { useAuth } from "../../../lib/auth-context";
import { resolveEngineCta } from "../../../lib/engine-cta";

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, isError } = useBlogPost(slug);
  const { user, isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);

  useSeo({
    title: post?.seoTitle || post?.title || "Market Insights",
    description: post?.seoDescription || post?.excerpt,
    ogImage: post?.coverImageUrl || undefined,
  });

  const quizCta = resolveEngineCta(user, isAuthenticated, "quiz");
  const propertiesCta = resolveEngineCta(user, isAuthenticated, "properties");

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) {
    return <BuildingLoader size="lg" label="Loading article…" className="py-32" />;
  }

  if (isError || !post) {
    return (
      <div className="py-28 text-center px-4">
        <div className="rounded-3xl liquid-glass p-12 max-w-lg mx-auto">
          <h2 className="font-heading text-2xl font-bold text-[#181818] mb-3">
            Article Not Found
          </h2>
          <p className="text-sm text-[#181818]/70 mb-6">
            The article you requested might have been moved or unpublished.
          </p>
          <Link to="/blog">
            <Button variant="primary" size="md" className="gap-2 !bg-[#5C4033]">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Articles</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="relative overflow-hidden py-12 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Back */}
        <div className="mb-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#5C4033] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Articles</span>
          </Link>
        </div>

        {/* Post Metadata Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5C4033]/10 px-3.5 py-1 text-xs font-bold text-[#5C4033]">
              <Tag className="h-3 w-3" />
              {post.category}
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#181818] leading-tight tracking-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-[#5C4033]/15 py-4 text-xs text-[#181818]/70">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-medium text-[#181818]">
                <User className="h-4 w-4 text-[#5C4033]" />
                <span>{post.authorName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#5C4033]" />
                <span>
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recent"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 font-semibold text-[#5C4033] hover:bg-white border border-white/80 shadow-sm transition"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-green-700">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share Article</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cover Photo */}
        {post.coverImageUrl && (
          <div className="my-8 overflow-hidden rounded-3xl liquid-glass p-2 shadow-xl">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="h-auto w-full max-h-[500px] rounded-2xl object-cover"
            />
          </div>
        )}

        {/* Lead Excerpt */}
        <div className="rounded-2xl liquid-glass p-6 my-8 border-l-4 border-[#5C4033]">
          <p className="text-base sm:text-lg font-medium text-[#181818]/90 italic leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        {/* Main Article Content */}
        <div className="mt-8 liquid-glass rounded-3xl p-6 sm:p-10 shadow-md">
          <MarkdownRenderer content={post.bodyMarkdown} />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#181818]/60 uppercase tracking-wider mr-1">
              Tags:
            </span>
            {post.tags.map((tag, i) => (
              <span
                key={i}
                className="rounded-lg bg-white/60 border border-white/80 px-2.5 py-1 text-xs font-medium text-[#5C4033]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Embedded Funnel CTA Widget */}
        <div className="mt-16 rounded-3xl bg-gradient-to-br from-[#181818] to-[#5C4033] p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#d4af37] border border-white/20 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Forth Urban AI Property Advisor
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold leading-snug">
              Ready to find verified Abuja plots aligned with this insight?
            </h3>
            <p className="mt-3 text-sm text-white/80 leading-relaxed max-w-xl">
              Take our 3-minute AI readiness quiz or view verified land opportunities in Abuja’s prime growth corridors.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to={quizCta.to} className="w-full sm:w-auto">
                <Button variant="premium" size="lg" className="w-full sm:w-auto rounded-full gap-2 font-bold shadow-lg">
                  <Sparkles className="h-4 w-4" />
                  <span>{quizCta.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to={propertiesCta.to} className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Building className="h-4 w-4" />
                  <span>{propertiesCta.label}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
