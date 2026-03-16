import html2canvas from "html2canvas";
import JSZip from "jszip";

const EXPORT_WIDTH = 1080;
const EXPORT_HEIGHT = 1920;

/**
 * Render a slide element to a full 1080×1920 PNG blob.
 * We temporarily clone the element at fixed size so html2canvas
 * captures the full Instagram-story resolution without artifacts.
 */
async function renderSlideToBlob(el: HTMLElement): Promise<Blob> {
  // Get the element's current rendered size
  const rect = el.getBoundingClientRect();
  const origW = rect.width;
  const origH = rect.height;

  // Calculate scale factor to fill 1080×1920
  const scaleX = EXPORT_WIDTH / origW;
  const scaleY = EXPORT_HEIGHT / origH;
  const scale = Math.min(scaleX, scaleY);

  // Clone element at its original size, then CSS-scale it up
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.width = `${origW}px`;
  clone.style.height = `${origH}px`;
  clone.style.borderRadius = "0";
  clone.style.position = "fixed";
  clone.style.left = "-9999px";
  clone.style.top = "0";
  clone.style.zIndex = "-1";
  clone.style.transform = `scale(${scale})`;
  clone.style.transformOrigin = "top left";
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 1,
      backgroundColor: null,
      width: EXPORT_WIDTH,
      height: EXPORT_HEIGHT,
      useCORS: true,
    });

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      }, "image/png");
    });
  } finally {
    document.body.removeChild(clone);
  }
}

export async function downloadSingleSlide(el: HTMLElement, index: number) {
  try {
    const blob = await renderSlideToBlob(el);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `story-slide-${index + 1}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Export error:", e);
  }
}

export async function downloadAllSlidesAsZip(
  slideRefs: (HTMLElement | null)[],
  filename = "story-slides.zip"
) {
  const zip = new JSZip();

  for (let i = 0; i < slideRefs.length; i++) {
    const el = slideRefs[i];
    if (!el) continue;
    try {
      const blob = await renderSlideToBlob(el);
      zip.file(`slide-${i + 1}.png`, blob);
    } catch (e) {
      console.error(`Export error on slide ${i + 1}:`, e);
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
