import type { AvatarAssetId, PropAssetId, TileEnvironment } from '../../assets/royal-inquest/manifest';
import type { Clue, MurdokuDefinition } from 'murdoku-logic-engine';

export interface RoyalInquestSkin {
  suspects: Record<string, { name: string; avatarId: AvatarAssetId }>;
  rooms: Record<string, { name: string; environment: TileEnvironment }>;
  props: Record<string, { assetId: PropAssetId }>;
}

const SUPPLEMENTAL_PREFIX = '(supplemental) ';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Turns an asset id like "wooden-bench-left" into a display phrase like "Wooden Bench Left". */
function humanizeAssetId(assetId: string): string {
  return assetId
    .split('-')
    .map((word) => (word.length ? word[0]!.toUpperCase() + word.slice(1) : word))
    .join(' ');
}

/**
 * Substitutes every suspect/room/prop id appearing in a clue's placeholder text with the skin's
 * display name (props render as a humanized version of their chosen asset id, since the skin has
 * no separate prop display name). Also strips the "(supplemental) " authoring prefix, which is
 * authoring metadata not meant for players.
 */
export function resolveClueText(clue: Clue, skin: RoyalInquestSkin, definition: MurdokuDefinition): string {
  const text = clue.text.startsWith(SUPPLEMENTAL_PREFIX) ? clue.text.slice(SUPPLEMENTAL_PREFIX.length) : clue.text;

  const tokens = new Map<string, string>();
  for (const suspect of definition.suspects) {
    const entry = skin.suspects[suspect.id];
    if (entry) tokens.set(suspect.id, entry.name);
  }
  for (const room of definition.rooms) {
    const entry = skin.rooms[room.id];
    if (entry) tokens.set(room.id, entry.name);
  }
  for (const prop of definition.props) {
    const entry = skin.props[prop.id];
    if (entry) tokens.set(prop.id, humanizeAssetId(entry.assetId));
  }

  const ids = [...tokens.keys()].sort((a, b) => b.length - a.length);
  if (ids.length === 0) return text;

  const pattern = new RegExp(`\\b(${ids.map(escapeRegExp).join('|')})\\b`, 'g');
  return text.replace(pattern, (match) => tokens.get(match) ?? match);
}
