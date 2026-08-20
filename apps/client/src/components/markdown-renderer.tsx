import React from "react";
import { cn } from "@forth-urban/ui";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Lightweight, safe parser for rendering blog article Markdown.
 * Supports headings, bold/italic text, blockquotes, unordered/ordered lists, links, images, and paragraphs.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
  let listKey = 0;

  const flushList = () => {
    if (!currentList) return;
    const ListTag = currentList.type;
    elements.push(
      <ListTag
        key={`list-${listKey++}`}
        className={cn(
          "my-4 pl-6 text-[#181818]/90 space-y-1.5",
          currentList.type === "ul" ? "list-disc" : "list-decimal",
        )}
      >
        {currentList.items.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {formatInlineText(item)}
          </li>
        ))}
      </ListTag>,
    );
    currentList = null;
  };

  const formatInlineText = (text: string): React.ReactNode => {
    // Process markdown links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(renderBoldItalic(text.substring(lastIndex, match.index)));
      }
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[2]}
          target={match[2].startsWith("http") ? "_blank" : undefined}
          rel={match[2].startsWith("http") ? "noopener noreferrer" : undefined}
          className="font-medium text-[#5C4033] underline decoration-[#5C4033]/40 underline-offset-2 transition hover:text-[#d4af37]"
        >
          {match[1]}
        </a>,
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(renderBoldItalic(text.substring(lastIndex)));
    }

    return parts.length > 0 ? parts : text;
  };

  const renderBoldItalic = (text: string): React.ReactNode => {
    // Process bold **text** or __text__
    const boldParts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
    return boldParts.map((part, i) => {
      if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
        const inner = part.slice(2, -2);
        return <strong key={i} className="font-bold text-[#181818]">{inner}</strong>;
      }
      // Process italic *text* or _text_
      const italicParts = part.split(/(\*[^*]+\*|_[^_]+_)/g);
      return italicParts.map((subPart, j) => {
        if ((subPart.startsWith("*") && subPart.endsWith("*")) || (subPart.startsWith("_") && subPart.endsWith("_"))) {
          const inner = subPart.slice(1, -1);
          return <em key={`${i}-${j}`} className="italic">{inner}</em>;
        }
        return subPart;
      });
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={idx} className="mt-8 mb-3 font-heading text-xl font-bold text-[#181818]">
          {formatInlineText(trimmed.replace(/^###\s+/, ""))}
        </h3>,
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={idx} className="mt-10 mb-4 font-heading text-2xl font-bold text-[#181818] tracking-tight">
          {formatInlineText(trimmed.replace(/^##\s+/, ""))}
        </h2>,
      );
      return;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={idx} className="mt-12 mb-6 font-heading text-3xl font-extrabold text-[#181818] tracking-tight">
          {formatInlineText(trimmed.replace(/^#\s+/, ""))}
        </h1>,
      );
      return;
    }

    // Image ![alt](url)
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      flushList();
      elements.push(
        <figure key={idx} className="my-8 overflow-hidden rounded-2xl liquid-glass p-2">
          <img
            src={imgMatch[2]}
            alt={imgMatch[1] || "Blog post illustration"}
            className="w-full rounded-xl object-cover max-h-[420px]"
            loading="lazy"
          />
          {imgMatch[1] && (
            <figcaption className="mt-2 text-center text-xs text-[#181818]/60 italic">
              {imgMatch[1]}
            </figcaption>
          )}
        </figure>,
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote
          key={idx}
          className="my-6 rounded-r-2xl border-l-4 border-[#5C4033] bg-white/40 backdrop-blur-sm p-4 italic text-[#181818]/90"
        >
          {formatInlineText(trimmed.replace(/^>\s+/, ""))}
        </blockquote>,
      );
      return;
    }

    // Unordered list
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const itemText = trimmed.replace(/^[-*]\s+/, "");
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      return;
    }

    // Ordered list
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      const itemText = orderedMatch[2];
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [itemText] };
      } else {
        currentList.items.push(itemText);
      }
      return;
    }

    // Paragraph
    flushList();
    elements.push(
      <p key={idx} className="my-4 text-base leading-relaxed text-[#181818]/85">
        {formatInlineText(trimmed)}
      </p>,
    );
  });

  flushList();

  return <div className={cn("article-prose", className)}>{elements}</div>;
}
