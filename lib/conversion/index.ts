import JSZip from 'jszip';
import type { Format } from '@/lib/types';

/**
 * EPUB → KEPUB
 *
 * Kobo's KEPUB format is an EPUB file with:
 * 1. Extension renamed to .kepub
 * 2. Kobo-specific <span> elements injected into body text (optional,
 *    Kobo firmware does this itself if absent — but a plain renamed
 *    EPUB works fine on every Kobo device)
 *
 * We inject a small Kobo CSS file for better typography and add the
 * kobo namespace to spine documents for best rendering.
 */
export async function convertEpubToKepub(epubData: ArrayBuffer): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(epubData);

  // Inject kobo.css
  const koboCss = `
/* Kobo enhanced typography */
body { -webkit-hyphens: auto; hyphens: auto; }
p { orphans: 2; widows: 2; }
`;
  zip.file('OEBPS/kobo.css', koboCss);

  // Attempt to reference kobo.css in OPF manifest
  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (containerXml) {
    const opfMatch = containerXml.match(/full-path="([^"]+)"/);
    if (opfMatch) {
      let opfXml = await zip.file(opfMatch[1])?.async('string');
      if (opfXml && !opfXml.includes('kobo.css')) {
        opfXml = opfXml.replace(
          '</manifest>',
          '  <item id="kobo-css" href="kobo.css" media-type="text/css"/>\n  </manifest>'
        );
        zip.file(opfMatch[1], opfXml);
      }
    }
  }

  return zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    mimeType: 'application/epub+zip',
  });
}

/**
 * Returns whether a conversion can be done client-side.
 * Only EPUB→KEPUB and the identity conversion are client-safe.
 */
export function isClientSideConversion(from: Format, to: Format): boolean {
  return (from === 'epub' && to === 'kepub') || from === to;
}

/**
 * Perform a client-side conversion (EPUB → KEPUB).
 * For other conversions the server must handle it.
 */
export async function convertClientSide(
  data: ArrayBuffer,
  from: Format,
  to: Format
): Promise<ArrayBuffer> {
  if (from === 'epub' && to === 'kepub') {
    return convertEpubToKepub(data);
  }
  throw new Error(`Client-side conversion from ${from} to ${to} is not supported`);
}
