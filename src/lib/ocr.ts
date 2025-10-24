import { ImageAnnotatorClient } from '@google-cloud/vision';
import { parseLikelyAmountFromText } from './amountParser';

let client: ImageAnnotatorClient | null = null;

function getVisionClient(): ImageAnnotatorClient {
  if (!client) {
    try {
      client = new ImageAnnotatorClient();
    } catch (err: any) {
      throw new Error(`Google Cloud Vision API 初始化失敗: ${err.message || String(err)}`);
    }
  }
  return client;
}

export async function detectTextAndAmount(imageBytes: Buffer): Promise<{ text: string; amount: number | null }> {
  try {
    const c = getVisionClient();
    const [result] = await c.textDetection({ image: { content: imageBytes } });
    const text = result.fullTextAnnotation?.text ?? (result.textAnnotations?.[0]?.description ?? '');
    const amount = parseLikelyAmountFromText(text);
    return { text, amount };
  } catch (err: any) {
    if (err.code === 'ENOTFOUND' || err.message?.includes('credentials')) {
      throw new Error('Google Cloud Vision API 認證失敗。請檢查 GOOGLE_APPLICATION_CREDENTIALS 環境變量或服務帳戶配置。');
    }
    if (err.code === 'PERMISSION_DENIED') {
      throw new Error('Google Cloud Vision API 權限不足。請檢查服務帳戶權限。');
    }
    if (err.code === 'QUOTA_EXCEEDED') {
      throw new Error('Google Cloud Vision API 配額已用完。請檢查您的帳戶配額。');
    }
    throw new Error(`OCR 處理失敗: ${err.message || String(err)}`);
  }
}


