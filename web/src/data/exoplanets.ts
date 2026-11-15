// The exoplanet catalog: the confirmed planets of the NASA Exoplanet Archive,
// Planetary Systems Composite Parameters table (DOI 10.26133/NEA13), read
// from the copy in public/data/exoplanets.csv.
//
// Pure data, no Three.js: the tests load this file in Node.

/** The twenty columns of the catalog, in the order the CSV has them. */
export const COLUMNS = [
  'pl_name', 'hostname', 'sy_pnum', 'discoverymethod', 'disc_year',
  'pl_rade', 'pl_bmasse', 'pl_dens', 'pl_eqt', 'pl_insol',
  'pl_orbper', 'pl_orbsmax', 'pl_orbeccen',
  'st_teff', 'st_rad', 'st_mass', 'st_spectype',
  'sy_dist', 'ra', 'dec',
] as const;

/**
 * One planet, field by field as the archive gives it. A value the archive
 * does not have is null; the game never fills it in with a made-up figure.
 */
export interface Exoplanet {
  /** Planet name, shown exactly as it comes. */
  pl_name: string;
  /** Name of the host star. */
  hostname: string;
  /** Number of planets in the system. */
  sy_pnum: number | null;
  /** How the planet was discovered (Transit, Radial Velocity...). */
  discoverymethod: string | null;
  /** Year of discovery. */
  disc_year: number | null;
  /** Radius, in Earth radii. */
  pl_rade: number | null;
  /** Mass, in Earth masses. */
  pl_bmasse: number | null;
  /** Density, in g/cm³. */
  pl_dens: number | null;
  /** Equilibrium temperature, in kelvin. */
  pl_eqt: number | null;
  /** Insolation flux, in Earth fluxes. */
  pl_insol: number | null;
  /** Orbital period, in days. */
  pl_orbper: number | null;
  /** Orbit semi-major axis, in astronomical units. */
  pl_orbsmax: number | null;
  /** Orbital eccentricity. */
  pl_orbeccen: number | null;
  /** Temperature of the star, in kelvin. */
  st_teff: number | null;
  /** Radius of the star, in solar radii. */
  st_rad: number | null;
  /** Mass of the star, in solar masses. */
  st_mass: number | null;
  /** Spectral type of the star (for example "M8.0 V"). */
  st_spectype: string | null;
  /** Distance from Earth, in parsecs. */
  sy_dist: number | null;
  /** Right ascension, in degrees. */
  ra: number | null;
  /** Declination, in degrees. */
  dec: number | null;
}

type TextField = 'pl_name' | 'hostname' | 'discoverymethod' | 'st_spectype';
const TEXT_FIELDS: ReadonlySet<string> = new Set<TextField>(['pl_name', 'hostname', 'discoverymethod', 'st_spectype']);

/**
 * Splits CSV text into rows of cells. Handles quoted cells (with commas and
 * doubled quotes inside), empty cells and both line endings.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        quoted = false;
      } else {
        cell += char;
      }
      i += 1;
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      if (char === '\r' && text[i + 1] === '\n') i += 1;
    } else {
      cell += char;
    }
    i += 1;
  }
  if (quoted) throw new Error('The CSV ends inside a quoted cell');
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** Turns the text of exoplanets.csv into the list of planets. */
export function parseCatalog(text: string): Exoplanet[] {
  const [header, ...rows] = parseCsv(text);
  if (!header || header.join(',') !== COLUMNS.join(',')) {
    throw new Error('The catalog header does not match the expected columns');
  }

  return rows
    .filter((cells) => !(cells.length === 1 && cells[0] === ''))
    .map((cells, index) => {
      const line = index + 2;
      if (cells.length !== COLUMNS.length) {
        throw new Error(`Line ${line} of the catalog has ${cells.length} cells, not ${COLUMNS.length}`);
      }
      const planet: Record<string, string | number | null> = {};
      COLUMNS.forEach((column, c) => {
        const raw = cells[c].trim();
        if (raw === '') {
          planet[column] = null;
        } else if (TEXT_FIELDS.has(column)) {
          planet[column] = raw;
        } else {
          const value = Number(raw);
          if (!Number.isFinite(value)) {
            throw new Error(`Line ${line} of the catalog: ${column} is not a number ("${raw}")`);
          }
          planet[column] = value;
        }
      });
      if (planet.pl_name === null || planet.hostname === null) {
        throw new Error(`Line ${line} of the catalog has no planet or star name`);
      }
      return planet as unknown as Exoplanet;
    });
}

let loaded: Promise<Exoplanet[]> | null = null;

/**
 * Loads the catalog once and keeps it in memory: every later call gets the
 * same list. The URL is relative to the page, so it works from any folder.
 */
export function loadCatalog(url = 'data/exoplanets.csv'): Promise<Exoplanet[]> {
  loaded ??= fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load the catalog (${response.status})`);
      return response.text();
    })
    .then(parseCatalog)
    .catch((error: unknown) => {
      loaded = null;
      throw error;
    });
  return loaded;
}
