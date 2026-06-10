import JSZip from 'jszip';
import type { EpubChapter } from '@/lib/types';

/**
 * Repack an EPUB zip with updated chapter content.
 * Returns the new EPUB as an ArrayBuffer.
 */
export async function repackEpub(
  zip: JSZip,
  updatedChapters: EpubChapter[]
): Promise<ArrayBuffer> {
  const newZip = new JSZip();

  // Copy all files from original zip
  for (const [relativePath, file] of Object.entries(zip.files)) {
    if (file.dir) {
      newZip.folder(relativePath);
    } else {
      const data = await file.async('arraybuffer');
      newZip.file(relativePath, data);
    }
  }

  // Overwrite modified chapters
  for (const chapter of updatedChapters) {
    newZip.file(chapter.href, chapter.content);
  }

  const blob = await newZip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    mimeType: 'application/epub+zip',
  });

  return blob;
}

/**
 * Replace the cover image inside an EPUB.
 */
export async function replaceCover(
  zip: JSZip,
  coverHref: string,
  newCoverData: ArrayBuffer
): Promise<JSZip> {
  zip.file(coverHref, newCoverData);
  return zip;
}

/**
 * Update OPF metadata fields (title, author, description) in-place.
 */
export async function updateOpfMetadata(
  zip: JSZip,
  fields: { title?: string; author?: string; description?: string }
): Promise<JSZip> {
  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (!containerXml) return zip;

  // Extract OPF path
  const opfMatch = containerXml.match(/full-path="([^"]+)"/);
  if (!opfMatch) return zip;
  const opfPath = opfMatch[1];

  let opfXml = await zip.file(opfPath)?.async('string');
  if (!opfXml) return zip;

  if (fields.title) {
    opfXml = opfXml.replace(
      /<dc:title[^>]*>[\s\S]*?<\/dc:title>/,
      `<dc:title>${escapeXml(fields.title)}</dc:title>`
    );
  }
  if (fields.author) {
    opfXml = opfXml.replace(
      /<dc:creator[^>]*>[\s\S]*?<\/dc:creator>/,
      `<dc:creator>${escapeXml(fields.author)}</dc:creator>`
    );
  }
  if (fields.description !== undefined) {
    if (opfXml.includes('<dc:description')) {
      opfXml = opfXml.replace(
        /<dc:description[^>]*>[\s\S]*?<\/dc:description>/,
        `<dc:description>${escapeXml(fields.description)}</dc:description>`
      );
    } else {
      opfXml = opfXml.replace(
        /<\/metadata>/,
        `  <dc:description>${escapeXml(fields.description)}</dc:description>\n  </metadata>`
      );
    }
  }

  zip.file(opfPath, opfXml);
  return zip;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
