import type { Book, Series, Format, OpdsFeed, OpdsEntry } from '@/lib/types';

const ATOM_NS = 'http://www.w3.org/2005/Atom';
const OPDS_NS = 'http://opds-spec.org/2010/catalog';
const DC_NS = 'http://purl.org/dc/terms/';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatEntry(entry: OpdsEntry, baseUrl: string): string {
  const links = entry.links
    .map(
      (l) =>
        `    <link rel="${l.rel}" href="${baseUrl}${l.href}" type="${l.type}"${
          l.title ? ` title="${escapeXml(l.title)}"` : ''
        }/>`
    )
    .join('\n');

  return `  <entry>
    <id>urn:uuid:${entry.id}</id>
    <title>${escapeXml(entry.title)}</title>
    <author><name>${escapeXml(entry.author)}</name></author>
    <updated>${entry.updated}</updated>
    ${entry.summary ? `<summary type="html">${escapeXml(entry.summary)}</summary>` : ''}
    ${entry.coverUrl ? `<link rel="http://opds-spec.org/image" href="${escapeXml(entry.coverUrl)}" type="image/jpeg"/>` : ''}
${links}
  </entry>`;
}

export function buildOpdsCatalog(baseUrl: string, books: Book[]): string {
  const updated = new Date().toISOString();

  const entries = books.flatMap((book) => {
    const downloadLinks = book.formats.map((f) => {
      const mimeTypes: Record<Format, string> = {
        epub: 'application/epub+zip',
        kepub: 'application/epub+zip',
        pdf: 'application/pdf',
        mobi: 'application/x-mobipocket-ebook',
        azw3: 'application/vnd.amazon.ebook',
      };
      return {
        rel: 'http://opds-spec.org/acquisition',
        href: `/api/opds/download/${book.id}/${f.format}`,
        type: mimeTypes[f.format],
        title: f.format.toUpperCase(),
      };
    });

    const entry: OpdsEntry = {
      id: book.id,
      title: book.title,
      author: book.author,
      updated: book.updatedAt,
      summary: book.description,
      coverUrl: book.coverUrl,
      links: downloadLinks,
    };

    return formatEntry(entry, baseUrl);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="${ATOM_NS}"
      xmlns:opds="${OPDS_NS}"
      xmlns:dc="${DC_NS}">
  <id>urn:shelf:catalog</id>
  <title>Shelf — My Library</title>
  <updated>${updated}</updated>
  <author>
    <name>Shelf</name>
    <uri>${baseUrl}</uri>
  </author>
  <link rel="self" href="${baseUrl}/api/opds" type="application/atom+xml;profile=opds-catalog"/>
  <link rel="start" href="${baseUrl}/api/opds" type="application/atom+xml;profile=opds-catalog"/>
  <link rel="search" href="${baseUrl}/api/opds/search{?q}" type="application/opensearchdescription+xml"/>

${entries.join('\n')}
</feed>`;
}

export function buildOpdsSearchDescription(baseUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>Shelf</ShortName>
  <Description>Search your Shelf library</Description>
  <Url type="application/atom+xml;profile=opds-catalog"
       template="${baseUrl}/api/opds/search?q={searchTerms}"/>
</OpenSearchDescription>`;
}
