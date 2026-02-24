import { useEffect } from 'react';

export function useCutter(nomes, titulo, setFormData) {
    useEffect(() => {
        try {
            const primeiroNome = (nomes || [])[0];
            if (!primeiroNome || !titulo) return;

            const nomeCompleto = primeiroNome.trim();
            const tituloLimpo = titulo.trim();
            if (nomeCompleto === "" || tituloLimpo === "") return;

            const partesNome = nomeCompleto.split(' ').filter(Boolean);
            let sobrenome = "";
            if (partesNome.length > 1) {
                const kinshipTerms = ['filho', 'neto', 'junior', 'júnior', 'sobrinho'];
                const lastWord = partesNome[partesNome.length - 1].toLowerCase();
                if (kinshipTerms.includes(lastWord)) {
                    const agnome = partesNome.pop();
                    const main = partesNome.pop();
                    sobrenome = (main + " " + agnome).toUpperCase();
                } else {
                    sobrenome = partesNome.pop().toUpperCase();
                }
            } else {
                sobrenome = partesNome[0].toUpperCase();
            }

            const letraAutor = sobrenome.charAt(0) || 'X';

            const lookupCutter = {
                'FAR': '224', 'SIL': '586', 'OLI': '482', 'SOU': '724',
                'MAC': '132', 'FER': '383', 'PIN': '657', 'GAR': '212',
                'BAR': '222', 'ALM': '447', 'COS': '837', 'RIB': '484'
            };

            const prefixo = sobrenome.substring(0, 3).toUpperCase();
            let numCutter = lookupCutter[prefixo];
            if (!numCutter) {
                let hash = 0;
                for (let i = 0; i < sobrenome.length; i++) {
                    hash = sobrenome.charCodeAt(i) + ((hash << 5) - hash);
                }
                numCutter = Math.abs(hash % 899) + 100;
            }
            const letraTitulo = tituloLimpo.charAt(0).toLowerCase() || 'x';
            const novoCutter = letraAutor + numCutter + letraTitulo;

            setFormData(prev => {
                if (prev.cutter === novoCutter) return prev;
                return { ...prev, cutter: novoCutter };
            });
        } catch (e) {
            console.error("Erro ao gerar Cutter:", e);
        }
    }, [nomes, titulo, setFormData]);
}
