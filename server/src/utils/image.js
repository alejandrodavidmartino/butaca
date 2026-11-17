import { HttpError } from './httpError.js';

// Convierte un "data URL" (data:image/jpeg;base64,...) en { data: Buffer, contentType }
// comprobando el tipo, el tamaño y la firma real del archivo. Se usa para fotos de grupo y de perfil.
export function parseImageDataUrl(dataUrl, maxBytes = 600 * 1024) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!match) throw new HttpError(400, 'La imagen debe ser JPG, PNG o WEBP');
  const data = Buffer.from(match[2], 'base64');
  if (data.length > maxBytes) throw new HttpError(413, 'La imagen es demasiado grande');

  // No basta con lo que diga el texto: miramos los primeros bytes del archivo
  const isJpeg = data[0] === 0xff && data[1] === 0xd8;
  const isPng = data.subarray(1, 4).toString() === 'PNG';
  const isWebp = data.subarray(8, 12).toString() === 'WEBP';
  if (!isJpeg && !isPng && !isWebp) throw new HttpError(400, 'El archivo no es una imagen válida');

  return { data, contentType: match[1] };
}

// Envía una imagen guardada en MongoDB con caché larga (la URL lleva ?v=versión)
export function sendImage(res, image) {
  res.set('Content-Type', image.contentType);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(image.data.buffer ? Buffer.from(image.data.buffer) : image.data);
}
