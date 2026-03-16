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
  const rect = el.getBoundingClientRect();
  const origW = rect.width;
  const origH = rect.height;

  // Use html2canvas scale to produce a 1080×1920 canvas from the small element
  const canvasScale = EXPORT_WIDTH / origW;

  const canvas = await html2canvas(el, {
    scale: canvasScale,
    backgroundColor: null,
    width: origW,
    height: origH,
    useCORS: true,
    // Ignore interactive buttons that shouldn't be in the export
    ignoreElements: (element) => element.tagName === "BUTTON",
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
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
