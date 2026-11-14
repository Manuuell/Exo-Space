// Downloads the catalog of confirmed exoplanets from the NASA Exoplanet
// Archive (Planetary Systems Composite Parameters table, DOI 10.26133/NEA13)
// and saves it in public/data/, next to a record of the query and the access
// date.
//
// The archive sends no CORS headers, so the game cannot query it from the
// browser: that is why it ships this copy.
//
// Usage: npm run data
import { mkdir, writeFile } from 'node:fs/promises';

const COLUMNS = [
  'pl_name', 'hostname', 'sy_pnum', 'discoverymethod', 'disc_year',
  'pl_rade', 'pl_bmasse', 'pl_dens', 'pl_eqt', 'pl_insol',
  'pl_orbper', 'pl_orbsmax', 'pl_orbeccen',
  'st_teff', 'st_rad', 'st_mass', 'st_spectype',
  'sy_dist', 'ra', 'dec',
];
const TABLE = 'pscomppars';
const SERVICE = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
const query = `select ${COLUMNS.join(',')} from ${TABLE}`;

const response = await fetch(`${SERVICE}?query=${encodeURIComponent(query)}&format=csv`);
if (!response.ok) throw new Error(`The archive answered ${response.status}`);
const csv = await response.text();

// Better to fail here than to leave a broken catalog inside the game.
const lines = csv.trimEnd().split('\n');
if (lines[0].trim() !== COLUMNS.join(',')) throw new Error('The header does not match the requested columns');
const planets = lines.length - 1;
if (planets < 5000) throw new Error(`Only ${planets} planets arrived: the download looks incomplete`);

const target = new URL('../public/data/', import.meta.url);
await mkdir(target, { recursive: true });
await writeFile(new URL('exoplanets.csv', target), csv);
await writeFile(new URL('exoplanets.meta.json', target), `${JSON.stringify({
  source: 'NASA Exoplanet Archive',
  table: 'Planetary Systems Composite Parameters (pscomppars)',
  doi: '10.26133/NEA13',
  url: 'https://exoplanetarchive.ipac.caltech.edu/',
  query,
  downloaded: new Date().toISOString().slice(0, 10),
  planets,
  columns: COLUMNS,
}, null, 2)}\n`);

console.log(`${planets} planets saved to public/data/exoplanets.csv`);
