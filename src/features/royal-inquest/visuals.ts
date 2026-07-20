import { royalInquestAssets } from '../../assets/royal-inquest/manifest';
import type { InquestCell, InquestCharacter, InquestDefinition } from './types';

export function getCharacterAvatarUrl(character: InquestCharacter): string {
  return royalInquestAssets.avatars[character.avatarId];
}

export function getCellTileUrl(definition: InquestDefinition, cell: InquestCell): string {
  const environment = definition.chamberEnvironments[cell.chamberId];
  const variants = royalInquestAssets.tiles[environment];
  const variantIndex = (cell.position.row * 5 + cell.position.column * 7) % variants.length;
  return variants[variantIndex];
}
