import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// El catálogo es la base de todo el juego: si falta o llega cambiado, mejor
// saberlo aquí que en mitad de una partida.

const COLUMNAS = [
  'pl_name', 'hostname', 'sy_pnum', 'discoverymethod', 'disc_year',
  'pl_rade', 'pl_bmasse', 'pl_dens', 'pl_eqt', 'pl_insol',
  'pl_orbper', 'pl_orbsmax', 'pl_orbeccen',
  'st_teff', 'st_rad', 'st_mass', 'st_spectype',
  'sy_dist', 'ra', 'dec',
];

const leer = (nombre: string) => readFileSync(new URL(`../public/datos/${nombre}`, import.meta.url), 'utf8');

test('el catálogo de exoplanetas tiene las columnas esperadas', () => {
  const lineas = leer('exoplanetas.csv').trimEnd().split('\n');
  assert.equal(lineas[0].trim(), COLUMNAS.join(','));
  assert.ok(lineas.length - 1 > 6000, `solo hay ${lineas.length - 1} planetas`);
});

test('la ficha de origen coincide con el catálogo', () => {
  const lineas = leer('exoplanetas.csv').trimEnd().split('\n');
  const ficha = JSON.parse(leer('exoplanetas.meta.json'));
  assert.equal(ficha.planetas, lineas.length - 1);
  assert.equal(ficha.doi, '10.26133/NEA13');
  assert.deepEqual(ficha.columnas, COLUMNAS);
  assert.match(ficha.descargado, /^\d{4}-\d{2}-\d{2}$/);
});
