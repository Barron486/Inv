import { ImageAnnotatorClient } from '@google-cloud/vision';
import { parseLikelyAmountFromText } from './amountParser';

let client: ImageAnnotatorClient | null = null;

function getVisionClient(): ImageAnnotatorClient {
  if (!client) {
    const options = buildVisionClientOptionsFromEnv();
    client = new ImageAnnotatorClient(options);
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

export function isVisionConfigured(): boolean {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_B64) {
    return true;
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return true;
  }
  return false;
}

function buildVisionClientOptionsFromEnv(): any {
  // Prefer inline JSON or base64 to avoid filesystem dependencies
  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const b64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_B64;
  const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || process.env.GOOGLE_PROJECT_ID;

  try {
    if (json) {
      const parsed = JSON.parse(json);
      const clientEmail: string | undefined = parsed.client_email;
      const privateKeyRaw: string | undefined = parsed.private_key;
      const privateKey = typeof privateKeyRaw === 'string' ? privateKeyRaw.replace(/\\n/g, '\n') : undefined;
      return clientEmail && privateKey
        ? { credentials: { client_email: clientEmail, private_key: privateKey }, projectId: parsed.project_id || projectId }
        : undefined;
    }
  } catch {
    // fall through
  }

  if (b64) {
    try {
      const decoded = Buffer.from(b64, 'base64').toString('utf8');
      const parsed = JSON.parse(decoded);
      const clientEmail: string | undefined = parsed.client_email;
      const privateKeyRaw: string | undefined = parsed.private_key;
      const privateKey = typeof privateKeyRaw === 'string' ? privateKeyRaw.replace(/\\n/g, '\n') : undefined;
      return clientEmail && privateKey
        ? { credentials: { client_email: clientEmail, private_key: privateKey }, projectId: parsed.project_id || projectId }
        : undefined;
    } catch {
      // fall through
    }
  }

  if (keyFilename) {
    // Let Google SDK resolve the file path
    return { keyFilename, projectId };
  }

  // No explicit options -> rely on ADC; may throw if not configured
  return projectId ? { projectId } : undefined;
}


