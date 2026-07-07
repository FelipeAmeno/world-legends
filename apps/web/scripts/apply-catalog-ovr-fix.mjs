/**
 * Aplica as correções calculadas por fix-catalog-ovr.mts diretamente no
 * texto de catalog-seeds.ts, tocando SOMENTE os valores numéricos dentro
 * do bloco baseAttrs do jogador corrigido. Preserva 100% da formatação e
 * dos casts (`as NationalityCode` etc.) do resto do arquivo.
 */
import fs from 'node:fs';

const correctionsPath = process.argv[2];
const catalogPath = process.argv[3];

const { corrections } = JSON.parse(fs.readFileSync(correctionsPath, 'utf8'));
const lines = fs.readFileSync(catalogPath, 'utf8').split('\n');

const byId = new Map(corrections.map((c) => [c.id, c]));
let applied = 0;
let i = 0;
while (i < lines.length) {
  const m = lines[i].match(/^\s{4}id: '([^']+)',$/);
  if (m && byId.has(m[1])) {
    const correction = byId.get(m[1]);
    // Procurar "    baseAttrs: {" a partir daqui, dentro deste bloco de player
    let j = i + 1;
    while (j < lines.length && !/^\s{4}baseAttrs: \{$/.test(lines[j])) {
      if (/^\s{2}\},$/.test(lines[j])) break; // saiu do player sem achar baseAttrs (não deveria ocorrer)
      j++;
    }
    if (/^\s{4}baseAttrs: \{$/.test(lines[j])) {
      let k = j + 1;
      while (k < lines.length && !/^\s{4}\},$/.test(lines[k])) {
        const attrMatch = lines[k].match(/^(\s{6})([a-z_]+): (-?\d+),$/);
        if (attrMatch) {
          const key = attrMatch[2];
          if (Object.prototype.hasOwnProperty.call(correction.after, key)) {
            lines[k] = `${attrMatch[1]}${key}: ${correction.after[key]},`;
          }
        }
        k++;
      }
      applied++;
    } else {
      console.error(`AVISO: baseAttrs não encontrado para ${m[1]}`);
    }
  }
  i++;
}

fs.writeFileSync(catalogPath, lines.join('\n'));
console.log(JSON.stringify({ applied, expected: corrections.length }));
