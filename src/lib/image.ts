import sharp from 'sharp';

export type EnhanceOptions = {
  autoCrop?: boolean; // 自動裁切邊緣
  sharpen?: boolean; // 銳化
  normalize?: boolean; // 自動對比
  threshold?: boolean; // 二值化（有助去背與 trim）
  output?: 'png' | 'jpeg';
};

export async function autoCropAndEnhance(input: Buffer, options: EnhanceOptions = {}): Promise<Buffer> {
  const { autoCrop = true, sharpen = true, normalize = true, threshold = true, output = 'png' } = options;

  let img = sharp(input, { failOn: false }).rotate(); // EXIF 自動旋轉

  // 先灰階，有助於之後的 threshold 與 trim
  img = img.grayscale();

  if (threshold) {
    img = img.threshold(128);
  }

  if (autoCrop) {
    // 以邊界顏色為基準移除邊緣（像是底色/桌面）
    // threshold 後 trim 效果較好
    img = img.trim();
  }

  if (normalize) {
    img = img.normalize();
  }

  if (sharpen) {
    // 適度銳化，避免過度產生 halo
    img = img.sharpen(1.2, 1, 2);
  }

  if (output === 'jpeg') {
    return await img.jpeg({ quality: 90 }).toBuffer();
  }
  return await img.png({ compressionLevel: 9 }).toBuffer();
}

export async function manualCrop(input: Buffer, region: { left: number; top: number; width: number; height: number }, output: 'png' | 'jpeg' = 'png'): Promise<Buffer> {
  const img = sharp(input, { failOn: false }).rotate().extract(region);
  if (output === 'jpeg') return await img.jpeg({ quality: 92 }).toBuffer();
  return await img.png({ compressionLevel: 9 }).toBuffer();
}


