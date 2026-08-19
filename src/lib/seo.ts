import { useEffect } from "react";

const setMeta = (selector: string, create: () => HTMLElement, apply: (el: HTMLElement) => void) => {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  apply(el);
};

/** Sets title, meta description and canonical for a public page. */
export const usePageMeta = (title?: string, description?: string, canonicalPath?: string) => {
  useEffect(() => {
    if (title) document.title = title.slice(0, 60);

    if (description) {
      setMeta(
        'meta[name="description"]',
        () => {
          const m = document.createElement("meta");
          m.setAttribute("name", "description");
          return m;
        },
        (el) => el.setAttribute("content", description.slice(0, 158)),
      );
    }

    if (canonicalPath) {
      setMeta(
        'link[rel="canonical"]',
        () => {
          const l = document.createElement("link");
          l.setAttribute("rel", "canonical");
          return l;
        },
        (el) => el.setAttribute("href", `${window.location.origin}${canonicalPath}`),
      );
    }
  }, [title, description, canonicalPath]);
};
