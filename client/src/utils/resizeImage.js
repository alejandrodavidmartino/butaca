// Reduce una foto en el navegador antes de subirla:
// la recorta en cuadrado (centrada) y la deja en size×size px en JPEG.
// Así una foto de 8 MB del móvil se queda en ~50 KB y la subida es instantánea.
export function resizeImage(file, size = 512, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) return reject(new Error('El archivo no es una imagen'));
    if (file.size > 20 * 1024 * 1024) return reject(new Error('La imagen pesa más de 20 MB'));

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height); // lado del cuadrado más grande que cabe
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1b1720'; // fondo por si la imagen tiene transparencia
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se ha podido leer la imagen'));
    };
    img.src = url;
  });
}
