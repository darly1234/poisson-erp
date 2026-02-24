export const loadHtml2Canvas = (onLoaded, onError) => {
    const scriptId = 'html2canvas-script';
    const existing = document.getElementById(scriptId);

    if (existing) {
        if (window.html2canvas) {
            onLoaded();
        } else {
            existing.addEventListener('load', onLoaded, { once: true });
        }
        return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.async = true;
    script.onload = onLoaded;
    script.onerror = onError;
    document.body.appendChild(script);
};

export const toRoman = (num) => {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return roman[num - 1] || num.toString();
};

export const formatIndexAuthor = (nome) => {
    if (!nome || typeof nome !== 'string') return "";
    const parts = nome.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0].toUpperCase();

    const kinshipTerms = ['filho', 'neto', 'junior', 'júnior', 'sobrinho'];
    const lastWord = parts[parts.length - 1].toLowerCase();

    let sobrenome = "";
    let first = "";

    if (kinshipTerms.includes(lastWord)) {
        const agnome = parts.pop();
        const main = parts.pop();
        sobrenome = (main + " " + agnome).toUpperCase();
        first = parts.join(' ');
    } else {
        sobrenome = parts.pop().toUpperCase();
        first = parts.join(' ');
    }

    return first ? sobrenome + ", " + first : sobrenome;
};

export const buildMainText = (formData) => {
    const titulo = (formData.titulo || "").trim();
    const resp = formData.responsabilidade === 'organizador' ? 'Organização: ' : '';
    const nomes = (formData.nomes || []).filter(Boolean).join(', ');
    const loc = formData.local || '';
    const uf = formData.uf || '';
    const ed = formData.editora || '';
    const ano = formData.ano || '';
    const pags = formData.paginas ? " " + formData.paginas + " p." : '';
    return titulo + " / " + resp + nomes + " – " + loc + " " + uf + ": " + ed + ", " + ano + "." + pags;
};

export const buildTracings = (formData) => {
    let text = "";
    const validKeywords = (formData.palavrasChave || []).filter(k => k && k.trim() !== "");
    validKeywords.forEach((pc, i) => { text += (i + 1) + ". " + pc.trim() + " "; });
    if (text.length > 0) text = text.trim() + ". ";
    const validNames = (formData.nomes || []).filter(n => n && n.trim() !== "");
    validNames.forEach((nome, i) => { text += toRoman(i + 1) + ". " + formatIndexAuthor(nome) + " "; });
    text += toRoman(validNames.length + 1) + ". Título";
    return text;
};

export const handleExportPNG = async (element, formData, exportScale, transparentBg, showMessage, setIsExporting) => {
    if (!window.html2canvas) {
        showMessage("Biblioteca de exportação carregando, aguarde.", 'error');
        return;
    }

    if (setIsExporting) setIsExporting(true);

    try {
        showMessage("Gerando PNG " + exportScale + "x (aguarde)...", 'success');

        const canvas = await window.html2canvas(element, {
            backgroundColor: transparentBg ? null : '#ffffff',
            scale: exportScale,
            useCORS: true,
            allowTaint: false,
            logging: false,
            width: element.offsetWidth,
            height: element.offsetHeight,
            scrollX: 0,
            scrollY: 0,
            onclone: (clonedDoc) => {
                const card = clonedDoc.getElementById('catalog-card');
                if (!card) return;

                card.style.backgroundColor = transparentBg ? 'transparent' : 'white';
                card.style.color = '#000000';
                card.style.fontWeight = 'normal';
                card.style.border = '1px solid #000000';
                card.style.WebkitFontSmoothing = 'none';
                card.style.MozOsxFontSmoothing = 'unset';
                card.style.textRendering = 'geometricPrecision';

                const textElements = card.querySelectorAll('div, span, p');
                textElements.forEach(el => {
                    el.style.color = '#000000';
                    el.style.fontWeight = 'normal';
                    el.style.WebkitFontSmoothing = 'none';
                    el.style.textRendering = 'geometricPrecision';
                    el.style.textShadow = '0 0 0.01px rgba(0,0,0,1)';
                });
            }
        });

        canvas.toBlob((blob) => {
            try {
                if (!blob) throw new Error("Blob nulo");
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.style.display = 'none';
                link.href = url;
                link.download = "ficha-" + (formData.cutter || "catalografica") + "-" + exportScale + "x.png";
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 1000);
                showMessage("PNG " + exportScale + "x salvo com sucesso!");
            } catch (blobErr) {
                showMessage("Erro ao gerar a imagem. Tente uma escala menor.", 'error');
            } finally {
                if (setIsExporting) setIsExporting(false);
            }
        }, 'image/png', 1.0);

    } catch (e) {
        if (setIsExporting) setIsExporting(false);
        showMessage("Erro ao exportar. Tente reduzir a escala.", 'error');
    }
};

export const handleExportWord = (formData, showMessage) => {
    const mainText = buildMainText(formData);
    const tracings = buildTracings(formData);
    const indentPoints = "18pt";

    const htmlDoc =
        "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>" +
        "<head>" +
        "<meta charset='utf-8'>" +
        "<style>" +
        "body { font-family: 'Courier New', monospace; font-size: 10pt; color: #000000; font-weight: normal; }" +
        ".container { width: 13cm; border: 0.5pt solid #000000; padding: 10pt; }" +
        ".main-text { margin-left: " + indentPoints + "; text-indent: -" + indentPoints + "; margin-bottom: 10pt; text-align: left; }" +
        ".tech-data { margin-left: " + indentPoints + "; margin-bottom: 10pt; }" +
        ".tracings { text-indent: " + indentPoints + "; margin-bottom: 15pt; }" +
        ".footer-cdd { text-align: right; font-size: 9pt; }" +
        ".librarian { border-top: 0.5pt solid #000000; padding-top: 5pt; text-align: center; margin-top: 10pt; }" +
        "</style>" +
        "</head>" +
        "<body>" +
        "<div style='text-align: center; font-size: 10pt; margin-bottom: 5pt;'>Dados Internacionais de Catalogação na Publicação (CIP)</div>" +
        "<div class='container'>" +
        "<div style='margin-bottom: 5pt;'>" + (formData.cutter || '') + "</div>" +
        "<div class='main-text'>" + mainText + "</div>" +
        "<div class='tech-data'>" +
        "Formato: " + (formData.formato || '') + "<br/>" +
        "ISBN: " + (formData.isbn || '') + "<br/>" +
        "DOI: " + (formData.doi || '') + "<br/>" +
        "Modo de acesso: " + (formData.modoAcesso || '') + "<br/>" +
        (formData.incluiBibliografia ? 'Inclui bibliografia' : '') +
        "</div>" +
        "<div class='tracings'>" + tracings + "</div>" +
        "<div class='footer-cdd'>CDD-" + (formData.cdd || '') + "</div>" +
        "</div>" +
        "<div class='librarian'>" +
        "<div>" + (formData.bibliotecaria || '') + " – CRB " + (formData.crb || '') + "</div>" +
        "</div>" +
        "</body>" +
        "</html>";

    try {
        const blob = new Blob([htmlDoc], { type: 'application/msword' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.download = "ficha-" + (formData.cutter || "catalografica") + ".doc";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 1000);
        showMessage("Documento Word (.doc) gerado!");
    } catch (e) {
        showMessage("Falha ao gerar Word.", 'error');
    }
};
