export const extractDominantColor = (imageUrl) => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      canvas.width = 64;
      canvas.height = 64;
      ctx.drawImage(img, 0, 0, 64, 64);

      const data = ctx.getImageData(0, 0, 64, 64).data;
      let r = 0,
        g = 0,
        b = 0;
      let count = 0;

      for (let i = 0; i < data.length; i += 16) {
        // Boost vibrancy by ignoring grays/blacks/whites
        const max = Math.max(data[i], data[i + 1], data[i + 2]);
        const min = Math.min(data[i], data[i + 1], data[i + 2]);
        if (max - min < 20 || max < 40 || min > 220) continue;

        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }

      if (count === 0) return resolve("rgba(244, 63, 94, 0.4)");

      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);

      resolve(`rgba(${r}, ${g}, ${b}, 0.5)`);
    };
    img.onerror = () => resolve("rgba(244, 63, 94, 0.3)");

    // Append a query parameter to bust the browser HTTP cache.
    // If the image was previously loaded via a normal <img> tag, it's cached without CORS headers.
    // By changing the URL slightly, we force a new network request with the correct Origin header.
    img.src =
      imageUrl + (imageUrl.includes("?") ? "&" : "?") + "not-from-cache-please";
  });
};
