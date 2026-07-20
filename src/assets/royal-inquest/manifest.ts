import monarch from './avatars/monarch.png';
import royalConsort from './avatars/royal-consort.png';
import royalHeir from './avatars/royal-heir.png';
import nobleman from './avatars/nobleman.png';
import noblewoman from './avatars/noblewoman.png';
import royalEnvoy from './avatars/royal-envoy.png';
import knight from './avatars/knight.png';
import guardCaptain from './avatars/guard-captain.png';
import courtPhysician from './avatars/court-physician.png';
import priest from './avatars/priest.png';
import monk from './avatars/monk.png';
import scholar from './avatars/scholar.png';
import steward from './avatars/steward.png';
import cook from './avatars/cook.png';
import maid from './avatars/maid.png';
import gardener from './avatars/gardener.png';
import merchant from './avatars/merchant.png';
import prisoner from './avatars/prisoner.png';

import throne from './props/throne.png';
import formalChair from './props/formal-chair.png';
import simpleChair from './props/simple-chair.png';
import woodenBench from './props/wooden-bench.png';
import woodenBenchLeft from './props/wooden-bench-left.png';
import woodenBenchRight from './props/wooden-bench-right.png';
import churchPew from './props/church-pew.png';
import churchPewLeft from './props/church-pew-left.png';
import churchPewRight from './props/church-pew-right.png';
import stonePlanter from './props/stone-planter.png';
import woodenPlanter from './props/wooden-planter.png';
import diningTable from './props/dining-table.png';
import diningTableLeft from './props/dining-table-left.png';
import diningTableRight from './props/dining-table-right.png';
import kitchenWorktable from './props/kitchen-worktable.png';
import kitchenWorktableLeft from './props/kitchen-worktable-left.png';
import kitchenWorktableRight from './props/kitchen-worktable-right.png';
import barrelCluster from './props/barrel-cluster.png';
import bookshelf from './props/bookshelf.png';
import bookshelfLeft from './props/bookshelf-left.png';
import bookshelfRight from './props/bookshelf-right.png';
import dungeonCage from './props/dungeon-cage.png';

import roomTimber1 from './tiles/room-timber-1.png';
import roomTimber2 from './tiles/room-timber-2.png';
import roomTimber3 from './tiles/room-timber-3.png';
import garden1 from './tiles/garden-1.png';
import garden2 from './tiles/garden-2.png';
import garden3 from './tiles/garden-3.png';
import churchStone1 from './tiles/church-stone-1.png';
import churchStone2 from './tiles/church-stone-2.png';
import churchStone3 from './tiles/church-stone-3.png';
import kitchenFlagstone1 from './tiles/kitchen-flagstone-1.png';
import kitchenFlagstone2 from './tiles/kitchen-flagstone-2.png';
import kitchenFlagstone3 from './tiles/kitchen-flagstone-3.png';
import hallwayStone1 from './tiles/hallway-stone-1.png';
import dungeonMasonry1 from './tiles/dungeon-masonry-1.png';
import royalMarble1 from './tiles/royal-marble-1.png';

export type AvatarAssetId =
  | 'monarch'
  | 'royal-consort'
  | 'royal-heir'
  | 'nobleman'
  | 'noblewoman'
  | 'royal-envoy'
  | 'knight'
  | 'guard-captain'
  | 'court-physician'
  | 'priest'
  | 'monk'
  | 'scholar'
  | 'steward'
  | 'cook'
  | 'maid'
  | 'gardener'
  | 'merchant'
  | 'prisoner';

export type PropAssetId =
  | 'throne'
  | 'formal-chair'
  | 'simple-chair'
  | 'wooden-bench'
  | 'wooden-bench-left'
  | 'wooden-bench-right'
  | 'church-pew'
  | 'church-pew-left'
  | 'church-pew-right'
  | 'stone-planter'
  | 'wooden-planter'
  | 'dining-table'
  | 'dining-table-left'
  | 'dining-table-right'
  | 'kitchen-worktable'
  | 'kitchen-worktable-left'
  | 'kitchen-worktable-right'
  | 'barrel-cluster'
  | 'bookshelf'
  | 'bookshelf-left'
  | 'bookshelf-right'
  | 'dungeon-cage';

export type TileEnvironment = 'room' | 'garden' | 'church' | 'kitchen' | 'hallway' | 'dungeon' | 'royalRoom';

export const propsByEnvironment: Record<TileEnvironment, readonly PropAssetId[]> = {
  royalRoom: ['throne', 'formal-chair'],
  room: [
    'bookshelf',
    'bookshelf-left',
    'bookshelf-right',
    'simple-chair',
    'wooden-bench',
    'wooden-bench-left',
    'wooden-bench-right',
    'barrel-cluster',
    'dining-table',
    'dining-table-left',
    'dining-table-right',
  ],
  church: ['church-pew', 'church-pew-left', 'church-pew-right'],
  dungeon: ['dungeon-cage', 'barrel-cluster'],
  garden: ['stone-planter', 'wooden-planter'],
  kitchen: [
    'kitchen-worktable',
    'kitchen-worktable-left',
    'kitchen-worktable-right',
    'barrel-cluster',
    'dining-table',
    'dining-table-left',
    'dining-table-right',
  ],
  hallway: [],
};

export const royalInquestAssets = {
  avatars: {
    monarch,
    'royal-consort': royalConsort,
    'royal-heir': royalHeir,
    nobleman,
    noblewoman,
    'royal-envoy': royalEnvoy,
    knight,
    'guard-captain': guardCaptain,
    'court-physician': courtPhysician,
    priest,
    monk,
    scholar,
    steward,
    cook,
    maid,
    gardener,
    merchant,
    prisoner,
  },
  props: {
    throne,
    'formal-chair': formalChair,
    'simple-chair': simpleChair,
    'wooden-bench': woodenBench,
    'wooden-bench-left': woodenBenchLeft,
    'wooden-bench-right': woodenBenchRight,
    'church-pew': churchPew,
    'church-pew-left': churchPewLeft,
    'church-pew-right': churchPewRight,
    'stone-planter': stonePlanter,
    'wooden-planter': woodenPlanter,
    'dining-table': diningTable,
    'dining-table-left': diningTableLeft,
    'dining-table-right': diningTableRight,
    'kitchen-worktable': kitchenWorktable,
    'kitchen-worktable-left': kitchenWorktableLeft,
    'kitchen-worktable-right': kitchenWorktableRight,
    'barrel-cluster': barrelCluster,
    bookshelf,
    'bookshelf-left': bookshelfLeft,
    'bookshelf-right': bookshelfRight,
    'dungeon-cage': dungeonCage,
  },
  tiles: {
    room: [roomTimber1, roomTimber2, roomTimber3],
    garden: [garden1, garden2, garden3],
    church: [churchStone1, churchStone2, churchStone3],
    kitchen: [kitchenFlagstone1, kitchenFlagstone2, kitchenFlagstone3],
    hallway: [hallwayStone1],
    dungeon: [dungeonMasonry1],
    royalRoom: [royalMarble1],
  },
} as const satisfies {
  avatars: Record<AvatarAssetId, string>;
  props: Record<PropAssetId, string>;
  tiles: Record<TileEnvironment, readonly string[]>;
};
