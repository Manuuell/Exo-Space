// Descarga el catálogo de exoplanetas confirmados del NASA Exoplanet Archive
// (tabla Planetary Systems Composite Parameters, DOI 10.26133/NEA13) y lo deja
// en public/datos/, junto a una ficha con la consulta y la fecha de acceso.
//
// El archivo no envía cabeceras CORS, así que el juego no puede consultarlo
// desde el navegador: por eso lleva esta copia dentro.
//
// Uso: npm run datos
import { mkdir, writeFile } from 'node:fs/promises';

const COLUMNAS = [
  'pl_name', 'hostname', 'sy_pnum', 'discoverymethod', 'disc_year',
  'pl_rade', 'pl_bmasse', 'pl_dens', 'pl_eqt', 'pl_insol',
  'pl_orbper', 'pl_orbsmax', 'pl_orbeccen',
  'st_teff', 'st_rad', 'st_mass', 'st_spectype',
  'sy_dist', 'ra', 'dec',
];
const TABLA = 'pscomppars';
const SERVICIO = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
const consulta = `select ${COLUMNAS.join(',')} from ${TABLA}`;

const respuesta = await fetch(`${SERVICIO}?query=${encodeURIComponent(consulta)}&format=csv`);
if (!respuesta.ok) throw new Error(`El archivo respondió ${respuesta.status}`);
const csv = await respuesta.text();

// Mejor fallar aquí que dejar un catálogo roto dentro del juego.
const lineas = csv.trimEnd().split('\n');
if (lineas[0].trim() !== COLUMNAS.join(',')) throw new Error('La cabecera no coincide con las columnas pedidas');
const planetas = lineas.length - 1;
if (planetas < 5000) throw new Error(`Solo llegaron ${planetas} planetas: la descarga parece incompleta`);

const destino = new URL('../public/datos/', import.meta.url);
await mkdir(destino, { recursive: true });
await writeFile(new URL('exoplanetas.csv', destino), csv);
await writeFile(new URL('exoplanetas.meta.json', destino), `${JSON.stringify({
  fuente: 'NASA Exoplanet Archive',
  tabla: 'Planetary Systems Composite Parameters (pscomppars)',
  doi: '10.26133/NEA13',
  url: 'https://exoplanetarchive.ipac.caltech.edu/',
  consulta,
  descargado: new Date().toISOString().slice(0, 10),
  planetas,
  columnas: COLUMNAS,
}, null, 2)}\n`);

console.log(`${planetas} planetas guardados en public/datos/exoplanetas.csv`);
