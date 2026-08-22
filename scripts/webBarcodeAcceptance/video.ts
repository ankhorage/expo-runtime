import type { BarcodeAcceptanceImage } from './types';

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;
const VIDEO_FRAME_RATE = 5;
const FRAMES_PER_BARCODE = 12;

export async function writeBarcodeVideo(
  path: string,
  images: readonly BarcodeAcceptanceImage[],
): Promise<void> {
  const header = `YUV4MPEG2 W${VIDEO_WIDTH} H${VIDEO_HEIGHT} F${VIDEO_FRAME_RATE}:1 Ip A1:1 C420jpeg\n`;
  const chromaPlane = Buffer.alloc((VIDEO_WIDTH * VIDEO_HEIGHT) / 4, 128);
  const parts: Uint8Array[] = [Buffer.from(header)];
  for (const image of images) {
    const lumaPlane = renderLumaPlane(image);
    for (let frame = 0; frame < FRAMES_PER_BARCODE; frame += 1) {
      parts.push(Buffer.from('FRAME\n'), lumaPlane, chromaPlane, chromaPlane);
    }
  }
  await Bun.write(path, Buffer.concat(parts));
}

function renderLumaPlane(image: BarcodeAcceptanceImage): Uint8Array {
  const output = new Uint8Array(VIDEO_WIDTH * VIDEO_HEIGHT).fill(235);
  const scale = Math.min(560 / image.width, 400 / image.height);
  const renderedWidth = Math.floor(image.width * scale);
  const renderedHeight = Math.floor(image.height * scale);
  const offsetX = Math.floor((VIDEO_WIDTH - renderedWidth) / 2);
  const offsetY = Math.floor((VIDEO_HEIGHT - renderedHeight) / 2);
  for (let y = 0; y < renderedHeight; y += 1) {
    for (let x = 0; x < renderedWidth; x += 1) {
      const sourceX = Math.floor(x / scale);
      const sourceY = Math.floor(y / scale);
      const sourceIndex = (sourceY * image.width + sourceX) * 4;
      const luminance = image.data.at(sourceIndex) ?? 255;
      output.set([luminance < 128 ? 16 : 235], (offsetY + y) * VIDEO_WIDTH + offsetX + x);
    }
  }
  return output;
}
