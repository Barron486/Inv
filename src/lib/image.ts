import sharp from 'sharp';

export type EnhanceOptions = {
  autoCrop?: boolean;
  sharpen?: boolean;
  normalize?: boolean;
  threshold?: boolean;
  output?: 'png' | 'jpeg';
};

export async function autoCropAndEnhance(input: Buffer, options: EnhanceOptions = {}): Promise<Buffer> {
  const { autoCrop = true, sharpen = true, normalize = true, threshold = true, output = 'png' } = options;

  let img = sharp(input, { failOn: false }).rotate();
  img = img.grayscale();

  if (threshold) {
    img = img.threshold(128);
  }

  if (autoCrop) {
    img = img.trim();
  }

  if (normalize) {
    img = img.normalize();
  }

  if (sharpen) {
    img = img.sharpen(1.2, 1, 2);
  }

  if (output === 'jpeg') {
    const buffer = await img.jpeg({ quality: 90 }).toBuffer();
    return Buffer.from(buffer);
  }
  const buffer = await img.png({ compressionLevel: 9 }).toBuffer();
  return Buffer.from(buffer);
}

export async function manualCrop(input: Buffer, region: { left: number; top: number; width: number; height: number }, output: 'png' | 'jpeg' = 'png'): Promise<Buffer> {
  const img = sharp(input, { failOn: false }).rotate().extract(region);
  if (output === 'jpeg') {
    const buffer = await img.jpeg({ quality: 92 }).toBuffer();
    return Buffer.from(buffer);
  }
  const buffer = await img.png({ compressionLevel: 9 }).toBuffer();
  return Buffer.from(buffer);
}
