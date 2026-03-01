/**
 * Utility to build a Crossref XML for Book/Monograph Deposits.
 * Follows Crossref best practices for Books (schema version 5.3.1 or 4.4.2)
 */

export const generateCrossrefXml = (data, depositorName, depositorEmail) => {
    // Current timestamp for batch_id
    const now = new Date();
    const batchId = `poisson-${now.getTime()}`;
    const timestamp = now.getTime(); // Deposit timestamp

    // Fallbacks
    const title = data.titulo || 'Untitled';
    const publisher = data.editora || 'Editora Poisson';
    const year = data.ano || now.getFullYear().toString();
    const isbnRaw = (data.isbn || '').replace(/\D/g, '');        // só dígitos — para a tag <isbn>
    const isbnFormatted = data.isbn || isbnRaw || 'draft';       // com hífens — para o DOI
    const doi = data.doi || `10.36229/${isbnFormatted || 'draft'}`;
    const resourceUrl = data.url || `https://poisson.com.br/livros/${isbnRaw}`;

    // Chapters array — when present, switches mode to edited_book
    const chapters = Array.isArray(data.chapters) ? data.chapters.filter(c => c.titulo && c.num) : [];
    const hasChapters = chapters.length > 0;
    const bookType = hasChapters ? 'edited_book' : 'monograph';

    // Generational suffixes that must NOT stand alone as the surname
    const GENERATIONAL_SUFFIXES = new Set([
        'filho', 'filha', 'neto', 'neta', 'bisneto', 'bisneta',
        'sobrinho', 'sobrinha', 'junior', 'júnior', 'jr', 'jr.',
        'segundo', '2o', '2º', 'terceiro', '3o', '3º'
    ]);

    // Smart name parser: keeps generational suffixes attached to the preceding surname word
    const parseName = (nome) => {
        const parts = nome.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return { givenName: '', surname: '' };
        if (parts.length === 1) return { givenName: '', surname: parts[0] };

        // Check if the last word is a generational suffix
        const lastLower = parts[parts.length - 1].toLowerCase().replace(/\.$/, '');
        if (GENERATIONAL_SUFFIXES.has(lastLower)) {
            const suffix = parts.pop();
            const baseSurname = parts.pop();
            return { givenName: parts.join(' '), surname: baseSurname ? `${baseSurname} ${suffix}` : suffix };
        }

        // Default: last word is the surname
        const surname = parts.pop();
        return { givenName: parts.join(' '), surname };
    };

    // Build contributor XML for an array of names
    const buildContributors = (nomes, responsabilidade) =>
        (nomes || []).map((nome, index) => {
            const { givenName, surname } = parseName(nome);
            const role = responsabilidade === 'organizador' ? 'editor' : 'author';
            return `
                        <person_name sequence="${index === 0 ? 'first' : 'additional'}" contributor_role="${role}">
                            <given_name>${escapeXml(givenName)}</given_name>
                            <surname>${escapeXml(surname)}</surname>
                        </person_name>`;
        }).join('');

    // Book-level contributors
    const contributors = buildContributors(data.nomes, data.responsabilidade);

    // Chapter content_items
    const chapterItems = chapters.map(ch => {
        // Parse comma-separated author string into array
        const chapterNomes = (ch.autores || '')
            .split(',')
            .map(n => n.trim())
            .filter(Boolean);
        const chapterContributors = buildContributors(chapterNomes, 'autor');
        const numPadded = String(ch.num).padStart(2, '0');
        const chapterDoi = `10.36229/${isbnFormatted}.CAP.${numPadded}`;

        return `
        <content_item component_type="chapter">
            ${chapterNomes.length > 0 ? `<contributors>${chapterContributors}
            </contributors>` : ''}
            <titles>
                <title>${escapeXml(ch.titulo)}</title>
            </titles>
            <publication_date media_type="print">
                <year>${year}</year>
            </publication_date>
            <publication_date media_type="online">
                <year>${year}</year>
            </publication_date>
            <doi_data>
                <doi>${chapterDoi}</doi>
                <resource>${escapeXml(resourceUrl)}</resource>
            </doi_data>
        </content_item>`;
    }).join('');

    // XML Schema (using 4.3.6 widely accepted for standard deposits)
    return `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch version="4.3.6" xmlns="http://www.crossref.org/schema/4.3.6" 
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
           xsi:schemaLocation="http://www.crossref.org/schema/4.3.6 http://www.crossref.org/schemas/crossref4.3.6.xsd">
    <head>
        <doi_batch_id>${batchId}</doi_batch_id>
        <timestamp>${timestamp}</timestamp>
        <depositor>
            <depositor_name>${escapeXml(depositorName || publisher)}</depositor_name>
            <email_address>${escapeXml(depositorEmail || 'contato@poisson.com.br')}</email_address>
        </depositor>
        <registrant>${escapeXml(publisher)}</registrant>
    </head>
    <body>
        <book book_type="${bookType}">
            <book_metadata language="pt">
                <contributors>${contributors}
                </contributors>
                <titles>
                    <title>${escapeXml(title)}</title>
                </titles>
                <publication_date media_type="print">
                    <year>${year}</year>
                </publication_date>
                <publication_date media_type="online">
                    <year>${year}</year>
                </publication_date>
                <isbn>${escapeXml(data.isbn)}</isbn>
                <publisher>
                    <publisher_name>${escapeXml(publisher)}</publisher_name>
                </publisher>
                <doi_data>
                    <doi>${doi}</doi>
                    <resource>${escapeXml(resourceUrl)}</resource>
                </doi_data>
            </book_metadata>${chapterItems}
        </book>
    </body>
</doi_batch>`;
};

// Simple XML character escaping
function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}
