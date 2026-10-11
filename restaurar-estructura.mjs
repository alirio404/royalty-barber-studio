// Reconstruye las carpetas del proyecto a partir de archivos "planos".
// Un archivo llamado  app__admin__page.tsx  pasa a ser  app/admin/page.tsx
// "~id~" dentro de un nombre pasa a ser "[id]" y "punto-gitignore" pasa a ser ".gitignore".
//
//   node restaurar-estructura.mjs           copia los archivos a sus carpetas (lo usa el build solo)
//   node restaurar-estructura.mjs --mover   MUEVE los archivos y deja el repositorio ordenado
import { readdirSync, mkdirSync, copyFileSync, renameSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const MOVER = process.argv.includes('--mover');
const ESPECIALES = { 'punto-gitignore': '.gitignore', 'punto-env.example': '.env.example' };
const raiz = process.cwd();
let total = 0;

for (const nombre of readdirSync(raiz)) {
  const ruta = join(raiz, nombre);
  if (!statSync(ruta).isFile()) continue;
  let destino = ESPECIALES[nombre];
  if (!destino && nombre.includes('__')) {
    destino = nombre
      .split('__')
      .map((p) => (/^~.+~$/.test(p) ? `[${p.slice(1, -1)}]` : p))
      .join('/');
  }
  if (!destino) continue;
  const salida = join(raiz, destino);
  mkdirSync(dirname(salida), { recursive: true });
  if (MOVER) renameSync(ruta, salida);
  else copyFileSync(ruta, salida);
  total++;
}
console.log(`restaurar-estructura: ${total} archivo(s) colocado(s) en su carpeta.`);
