import {
  cacheDirectory,
  copyAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

function normalizeFileUri(uri: string): string {
  if (!uri) {
    return uri;
  }

  if (/^file:\/\//i.test(uri)) {
    return uri;
  }

  if (/^file:/i.test(uri)) {
    const pathWithoutScheme = uri.replace(/^file:\/*/i, '');
    return `file:///${pathWithoutScheme}`;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(uri)) {
    return uri;
  }

  return `file://${uri}`;
}

async function withPngExtension(uri: string): Promise<string> {
  const normalizedUri = normalizeFileUri(uri);
  if (Platform.OS !== 'android' || normalizedUri.toLowerCase().endsWith('.png')) {
    return normalizedUri;
  }

  if (!cacheDirectory) {
    return normalizedUri;
  }

  const targetUri = `${cacheDirectory}share-${Date.now()}.png`;

  try {
    const asBase64 = await readAsStringAsync(normalizedUri, { encoding: 'base64' });
    await writeAsStringAsync(targetUri, asBase64, { encoding: 'base64' });
    return targetUri;
  } catch {
    // If read/write fails (for example with unusual URI schemes), try a direct copy fallback.
  }

  try {
    await copyAsync({
      from: normalizedUri,
      to: targetUri,
    });
    return targetUri;
  } catch {
    // Fallback to the original capture URI if we cannot duplicate it with a .png extension.
    return normalizedUri;
  }
}

export async function sharePngImage(uri: string, dialogTitle?: string): Promise<void> {
  const shareableUri = await withPngExtension(uri);
  await Sharing.shareAsync(shareableUri, {
    mimeType: 'image/png',
    UTI: 'public.png',
    dialogTitle,
  });
}
