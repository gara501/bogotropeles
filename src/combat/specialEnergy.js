import {ARCADE} from '../data/arcade.js';
export const SPECIAL_ENERGY_COST=ARCADE.player.specialLifeCost;

export function canSpendSpecialEnergy(scene) {
  return scene.health>SPECIAL_ENERGY_COST;
}

export function spendSpecialEnergy(scene) {
  if(!canSpendSpecialEnergy(scene))return false;
  scene.health-=SPECIAL_ENERGY_COST;
  if(scene.healthBar)scene.healthBar.width=scene.health*2;
  return true;
}
