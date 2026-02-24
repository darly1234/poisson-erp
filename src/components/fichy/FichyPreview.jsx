import React, { forwardRef } from 'react';
import Barcode from 'react-barcode';
import { buildMainText, buildTracings } from './exportUtils';

const FichyPreview = forwardRef(({ formData }, ref) => {
    const cleanIsbn = formData.isbn ? formData.isbn.replace(/\D/g, '') : '';
    const isValidIsbn = cleanIsbn.length === 13;

    // Função para validar o dígito verificador do padrão EAN-13
    const validateEAN13 = (isbn) => {
        if (isbn.length !== 13) return false;
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(isbn[i], 10) * (i % 2 === 0 ? 1 : 3);
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit === parseInt(isbn[12], 10);
    };

    const isValidCheckDigit = isValidIsbn && validateEAN13(cleanIsbn);

    return (
        <div id="catalog-card-container" className="flex flex-col md:flex-row flex-wrap justify-center items-start gap-8">
            <div className="flex flex-col items-center">
                <div className="text-center text-[10px] font-sans mb-2 uppercase tracking-tight text-slate-500 italic">
                    Dados Internacionais de Catalogação na Publicação (CIP)
                </div>

                <div
                    id="catalog-card"
                    ref={ref}
                    className="flex flex-col overflow-hidden bg-white"
                    style={{
                        width: '13cm',
                        minHeight: '8cm',
                        fontFamily: '"Courier New", Courier, monospace',
                        fontSize: '10pt',
                        lineHeight: '1.2',
                        fontWeight: 'normal',
                        color: '#000000',
                        border: '1px solid #000000',
                        boxSizing: 'content-box',
                        WebkitFontSmoothing: 'none'
                    }}
                >
                    <div className="pt-3 pl-4" style={{ color: '#000000', fontWeight: 'normal' }}>
                        {formData.cutter}
                    </div>

                    <div className="px-10 py-1" style={{ color: '#000000' }}>
                        <div className="mb-4 text-left" style={{ marginLeft: '3ch', textIndent: '-3ch', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#000000', fontWeight: 'normal' }}>
                            {buildMainText(formData)}
                        </div>

                        <div className="mb-4 space-y-0.5" style={{ marginLeft: '3ch', color: '#000000', fontWeight: 'normal' }}>
                            {formData.formato && <div>{"Formato: " + formData.formato}</div>}
                            {formData.isbn && <div>{"ISBN: " + formData.isbn}</div>}
                            {formData.doi && <div>{"DOI: " + formData.doi}</div>}
                            {formData.modoAcesso && <div>{"Modo de acesso: " + formData.modoAcesso}</div>}
                            {formData.incluiBibliografia && <div>Inclui bibliografia</div>}
                        </div>

                        <div className="text-left leading-snug mb-4" style={{ marginLeft: '0ch', textIndent: '3ch', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#000000', fontWeight: 'normal' }}>
                            {buildTracings(formData)}
                        </div>
                    </div>

                    <div className="mt-auto flex justify-end px-4 py-1 text-[9pt]" style={{ color: '#000000', fontWeight: 'normal' }}>
                        {"CDD-" + formData.cdd}
                    </div>

                    <div className="px-4 text-[9pt]" style={{ color: '#000000' }}>&nbsp;</div>

                    <div className="border-t py-2 text-center text-[10pt] font-sans" style={{ borderColor: '#000000', color: '#000000', fontWeight: 'normal' }}>
                        <div className="px-4 uppercase tracking-tighter">{formData.bibliotecaria + " – CRB " + formData.crb}</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-w-[200px] min-h-[150px] justify-center mt-6 md:mt-0" id="barcode-container">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Código de Barras (ISBN)</div>
                {!isValidIsbn ? (
                    <div className="text-[10px] text-slate-400 italic text-center max-w-[150px]">
                        Digite um ISBN válido de 13 dígitos para gerar o código.
                    </div>
                ) : isValidCheckDigit ? (
                    <Barcode
                        value={cleanIsbn}
                        format="EAN13"
                        renderer="canvas"
                        width={2}
                        height={60}
                        fontSize={14}
                        margin={0}
                        background="transparent"
                    />
                ) : (
                    <div className="text-[10px] text-red-500 italic text-center max-w-[150px] font-medium border border-red-200 bg-red-50 p-2 rounded">
                        ISBN Inválido!<br />O dígito verificador está incorreto. Revise a numeração.
                    </div>
                )}
            </div>
        </div>
    );
});

FichyPreview.displayName = 'FichyPreview';

export default FichyPreview;
