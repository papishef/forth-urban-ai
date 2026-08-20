import { useEffect } from "react";

interface SeoOptions {
  title: string;
  description?: string;
  ogImage?: string;
}

/**
 * Lightweight hook to set document title and meta description dynamically.
 */
export function useSeo({ title, description, ogImage }: SeoOptions) {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${title} | Forth Urban — Abuja AI Property Advisor`;

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);
    }

    if (ogImage) {
      let metaOgImage = document.querySelector('meta[property="og:image"]');
      if (!metaOgImage) {
        metaOgImage = document.createElement("meta");
        metaOgImage.setAttribute("property", "og:image");
        document.head.appendChild(metaOgImage);
      }
      metaOgImage.setAttribute("content", ogImage);
    }

    return () => {
      document.title = originalTitle;
    };
  }, [title, description, ogImage]);
}
