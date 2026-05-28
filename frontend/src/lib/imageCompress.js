/**
 * Compress an image file client-side using canvas.
 * Resizes to max width 1200px and re-encodes as JPEG 0.75 quality.
 * Returns a new File object suitable for FormData upload.
 */
export async function compressImage(file, { maxWidth = 1200, quality = 0.75 } = {}) {
  // Skip compression for tiny files or non-images
  if (!file.type.startsWith("image/") || file.size < 200 * 1024) {
    return file;
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = reject;
    img.onload = () => {
      const ratio = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          // Only use compressed version if it's actually smaller
          if (blob.size >= file.size) { resolve(file); return; }
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}
