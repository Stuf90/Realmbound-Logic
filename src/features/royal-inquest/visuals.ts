import { positionKey } from '../../shared/geometry';
import { royalInquestAssets } from '../../assets/royal-inquest/manifest';
import type { InquestCell, InquestCharacter, InquestDefinition } from './types';

export function getCharacterAvatarUrl(character: InquestCharacter): string {
  return royalInquestAssets.avatars[character.avatarId];
}

function hashChamberId(chamberId: string): number {
  let hash = 0;
  for (let index = 0; index < chamberId.length; index += 1) {
    hash = (hash * 31 + chamberId.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getCellTileUrl(definition: InquestDefinition, cell: InquestCell): string {
  const environment = definition.chamberEnvironments[cell.chamberId];
  const variants = royalInquestAssets.tiles[environment];
  const variantIndex = hashChamberId(cell.chamberId) % variants.length;
  return variants[variantIndex];
}

export interface CellWalls {
  right: boolean;
  bottom: boolean;
}

export function getCellWalls(definition: InquestDefinition, cell: InquestCell): CellWalls {
  const rightNeighbor = definition.cells.find(
    (candidate) =>
      positionKey(candidate.position) ===
      positionKey({ row: cell.position.row, column: cell.position.column + 1 }),
  );
  const bottomNeighbor = definition.cells.find(
    (candidate) =>
      positionKey(candidate.position) ===
      positionKey({ row: cell.position.row + 1, column: cell.position.column }),
  );
  return {
    right: rightNeighbor !== undefined && rightNeighbor.chamberId !== cell.chamberId,
    bottom: bottomNeighbor !== undefined && bottomNeighbor.chamberId !== cell.chamberId,
  };
}
