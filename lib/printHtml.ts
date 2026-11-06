// lib/printHtml.ts

// Waits for logos and signatures, so the printed copy never misses them.
function waitForImages(doc: Document, timeoutMs = 4000): Promise<void> {
  const pending = Array.from(doc.images).filter((img) => !img.complete);
  if (pending.length === 0) return Promise.resolve();

  return new Promise((resolve) => {
    let left = pending.length;
    const done = () => {
      left -= 1;
      if (left <= 0) resolve();
    };
    pending.forEach((img) => {
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
    setTimeout(resolve, timeoutMs);
  });
}

export function printHtml(html: string, title: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    // No scripts run inside it. allow-modals is what lets the print dialog open.
    iframe.setAttribute("sandbox", "allow-same-origin allow-modals");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";

    iframe.onload = async () => {
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument;
      const previousTitle = document.title;
      try {
        if (!win || !doc) throw new Error("Could not open the print dialog.");
        await waitForImages(doc);
        // Browsers suggest this as the file name when saving as PDF.
        doc.title = title;
        document.title = title;
        win.focus();
        win.print();
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        document.title = previousTitle;
        setTimeout(() => iframe.remove(), 60_000);
      }
    };

    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  });
}