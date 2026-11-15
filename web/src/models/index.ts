// The catalog of every model in the game. A new model is added here with its
// type, and the tests in test/models.test.ts check it against the contract
// in contract.ts.

import type { ModelEntry } from './kit.ts';
import { exodus } from './boss-exodus.ts';
import { drone } from './enemy-drone.ts';
import { golem } from './enemy-golem.ts';
import { gorgemaw } from './enemy-gorgemaw.ts';
import { rover } from './enemy-rover.ts';
import { skyray } from './enemy-skyray.ts';
import { spineback } from './enemy-spineback.ts';
import { stinglash } from './enemy-stinglash.ts';
import { twinfang } from './enemy-twinfang.ts';
import { wyvern } from './enemy-wyvern.ts';
import { bastion } from './guardian-bastion.ts';
import { rootmaw } from './guardian-rootmaw.ts';
import { ashwing } from './guardian-ashwing.ts';
import { dragonNest } from './prop-dragon-nest.ts';
import { veilkeeper } from './guardian-veilkeeper.ts';
import { hero } from './hero.ts';
import { heroCartoon } from './hero-cartoon.ts';
import { heroExplorer } from './hero-explorer.ts';
import { kitShapes } from './kit-shapes.ts';
import { bloomkin } from './npc-bloomkin.ts';
import { drifter } from './npc-drifter.ts';
import { forgeback } from './npc-forgeback.ts';
import { lumen } from './npc-lumen.ts';
import { broodmother } from './subboss-broodmother.ts';
import { cinderhermit } from './subboss-cinderhermit.ts';
import { frostwyrm } from './subboss-frostwyrm.ts';
import { overseer } from './subboss-overseer.ts';
import { homeward } from './ship-homeward.ts';
import { ruinGate } from './prop-ruin-gate.ts';
import { giantTree } from './prop-giant-tree.ts';
import { worldProps } from './props-world.ts';
import { mossback } from './fauna-mossback.ts';
import { puffhop } from './fauna-puffhop.ts';
import { skyfin } from './fauna-skyfin.ts';
import { testCube } from './test-cube.ts';
import { weapons } from './weapons.ts';

export const CATALOG: readonly ModelEntry[] = [heroCartoon, ...weapons, homeward, ruinGate, giantTree, dragonNest, ...worldProps, mossback, puffhop, skyfin, bloomkin, forgeback, lumen, drifter, spineback, golem, twinfang, stinglash, gorgemaw, skyray, wyvern, rover, drone, ashwing, rootmaw, bastion, veilkeeper, exodus, broodmother, overseer, cinderhermit, frostwyrm, heroExplorer, hero, testCube, kitShapes];

export function modelById(id: string): ModelEntry | undefined {
  return CATALOG.find((entry) => entry.id === id);
}
