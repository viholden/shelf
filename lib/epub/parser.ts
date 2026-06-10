import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';
import type { EpubChapter, EpubMetadata } from '@/lib/types';

async function parseXml(xml: string): Promise<Record<string, unknown>> {
  return parseStringPromise(xml, {
    explicitArray: false,
    ignoreAttrs: false,
    mergeAttrs: true,
  });
}

function getText(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object' && '_' in (val as Record<string, unknown>)) {
    return String((val as Record<string, unknown>)._);
  }
  return '';
}

export async function parseEpub(data: ArrayBuffer): Promise<{
  zip: JSZip;
  metadata: EpubMetadata;
}> {
  const zip = await JSZip.loadAsync(data);

  // 1. Read container.xml to find OPF path
  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (!containerXml) throw new Error('Invalid EPUB: missing container.xml');

  const container = await parseXml(containerXml);
  const rootfiles =
    (container as Record<string, Record<string, Record<string, unknown>>>)
      .container?.rootfiles?.rootfile;
  const opfPath = (Array.isArray(rootfiles) ? rootfiles[0] : rootfiles)?.['full-path'] as string;
  if (!opfPath) throw new Error('Invalid EPUB: cannot find OPF path');

  // 2. Parse OPF
  const opfXml = await zip.file(opfPath)?.async('string');
  if (!opfXml) throw new Error('Invalid EPUB: missing OPF file');

  const opfBase = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
  const opf = await parseXml(opfXml);
  const pkg = (opf as Record<string, unknown>)['package'] as Record<string, unknown>;

  // 3. Extract metadata
  const meta = pkg['metadata'] as Record<string, unknown>;
  const title = getText(meta?.['dc:title'] ?? meta?.['title']) || 'Unknown Title';
  const author =
    getText(
      Array.isArray(meta?.['dc:creator'])
        ? (meta?.['dc:creator'] as unknown[])[0]
        : meta?.['dc:creator']
    ) || 'Unknown Author';
  const description = getText(meta?.['dc:description']) || undefined;
  const language = getText(meta?.['dc:language']) || 'en';
  const publisher = getText(meta?.['dc:publisher']) || undefined;

  // 4. Build manifest
  const manifestRaw = pkg['manifest'] as Record<string, unknown>;
  const itemsRaw = manifestRaw?.['item'];
  const itemsArr = Array.isArray(itemsRaw)
    ? itemsRaw
    : itemsRaw
    ? [itemsRaw]
    : [];

  const manifest: Record<string, { href: string; mediaType: string }> = {};
  let coverHref: string | undefined;

  for (const item of itemsArr as Record<string, unknown>[]) {
    const attrs = item['$'] as Record<string, string> | undefined;
    const id = (item['id'] as string) || attrs?.id;
    const href = (item['href'] as string) || attrs?.href;
    const mediaType = (item['media-type'] as string) || attrs?.['media-type'];
    if (id && href) {
      manifest[id] = { href: opfBase + href, mediaType: mediaType ?? '' };
      if (
        ((item['properties'] as string) || attrs?.properties) === 'cover-image' ||
        id === 'cover' ||
        id === 'cover-image'
      ) {
        coverHref = opfBase + href;
      }
    }
  }

  // 5. Build spine
  const spineRaw = pkg['spine'] as Record<string, unknown>;
  const spineItemsRaw = spineRaw?.['itemref'];
  const spineItems = Array.isArray(spineItemsRaw)
    ? spineItemsRaw
    : spineItemsRaw
    ? [spineItemsRaw]
    : [];

  const spine: string[] = (spineItems as Record<string, unknown>[]).map((r) => {
    const attrs = r['$'] as Record<string, string> | undefined;
    return (r['idref'] as string) || attrs?.idref || '';
  }).filter(Boolean);

  // 6. Build chapters from NCX or spine
  const chapters: EpubChapter[] = [];
  const ncxId = (spineRaw['toc'] as string) || 'ncx';
  const ncxPath = manifest[ncxId]?.href;
  let chapterTitles: Record<string, string> = {};

  if (ncxPath) {
    const ncxXml = await zip.file(ncxPath)?.async('string');
    if (ncxXml) {
      try {
        const ncx = await parseXml(ncxXml);
        const navMap = (ncx as Record<string, Record<string, unknown>>)['ncx']?.[
          'navMap'
        ] as Record<string, unknown>;
        const navPoints = navMap?.['navPoint'];
        const points = Array.isArray(navPoints) ? navPoints : navPoints ? [navPoints] : [];
        for (const p of points as Record<string, unknown>[]) {
          const content = p['content'] as Record<string, unknown> | undefined;
          const contentAttrs = content?.['$'] as Record<string, unknown> | undefined;
          const src = getText(content?.['src'] || contentAttrs?.['src']);
          const navLabel = p['navLabel'] as Record<string, unknown> | undefined;
          const label = getText(navLabel?.['text']);
          // Remove fragment identifiers for matching
          const hrefKey = src.split('#')[0];
          chapterTitles[hrefKey] = label;
        }
      } catch {
        // NCX parse failure is non-fatal
      }
    }
  }

  for (let i = 0; i < spine.length; i++) {
    const idref = spine[i];
    const item = manifest[idref];
    if (!item) continue;

    const href = item.href;
    const titleKey = href.replace(opfBase, '').split('#')[0];
    const title = chapterTitles[titleKey] || chapterTitles[href.split('#')[0]] || `Chapter ${i + 1}`;

    const contentFile = zip.file(href) ?? zip.file(href.replace(opfBase, ''));
    const content = (await contentFile?.async('string')) ?? '';

    chapters.push({ id: idref, title, href, content, order: i });
  }

  return {
    zip,
    metadata: {
      title,
      author,
      description,
      language,
      publisher,
      coverHref,
      spine,
      manifest,
      chapters,
    },
  };
}

export async function getCoverDataUrl(
  zip: JSZip,
  coverHref: string | undefined
): Promise<string | undefined> {
  if (!coverHref) return undefined;
  const file = zip.file(coverHref);
  if (!file) return undefined;
  const data = await file.async('base64');
  const ext = coverHref.split('.').pop()?.toLowerCase();
  const mime =
    ext === 'jpg' || ext === 'jpeg'
      ? 'image/jpeg'
      : ext === 'png'
      ? 'image/png'
      : 'image/jpeg';
  return `data:${mime};base64,${data}`;
}
