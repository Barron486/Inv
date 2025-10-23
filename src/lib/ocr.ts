import { ImageAnnotatorClient } from '@google-cloud/vision';
import { parseLikelyAmountFromText } from './amountParser';

let client: ImageAnnotatorClient | null = null;

function getVisionClient(): ImageAnnotatorClient {
  if (!client) {
    client = new ImageAnnotatorClient();
  }
  return client;
}

export async function detectTextAndAmount(imageBytes: Buffer): Promise<{ text: string; amount: number | null }> {
  const c = getVisionClient();
  const [result] = await c.textDetection({ image: { content: imageBytes } });
  const text = result.fullTextAnnotation?.text ?? (result.textAnnotations?.[0]?.description ?? '');
  const amount = parseLikelyAmountFromText(text);
  return { text, amount };
}


