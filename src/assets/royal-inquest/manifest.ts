import manualCross from './marks/manual-cross.png';
import autoCross from './marks/auto-cross.png';
import hayBale from './props/hay-bale.png';
import feedTrough from './props/feed-trough.png';
import well from './props/well.png';
import scarecrow from './props/scarecrow.png';
import farmFence from './props/farm-fence.png';
import tavernBar from './props/tavern-bar.png';
import barstool from './props/barstool.png';
import aleBarrel from './props/ale-barrel.png';
import fireplace from './props/fireplace.png';
import dartboard from './props/dartboard.png';
import cabinBed from './props/cabin-bed.png';
import woodStove from './props/wood-stove.png';
import washbasin from './props/washbasin.png';
import rockingChair from './props/rocking-chair.png';
import chest from './props/chest.png';
import farmDirt1 from './tiles/farm-dirt-1.png';
import farmDirt2 from './tiles/farm-dirt-2.png';
import farmDirt3 from './tiles/farm-dirt-3.png';
import tavernPlanks1 from './tiles/tavern-planks-1.png';
import tavernPlanks2 from './tiles/tavern-planks-2.png';
import tavernPlanks3 from './tiles/tavern-planks-3.png';
import cabinLog1 from './tiles/cabin-log-1.png';
import cabinLog2 from './tiles/cabin-log-2.png';
import cabinLog3 from './tiles/cabin-log-3.png';

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
import candleStand from './props/candle-stand.png';
import offeringChest from './props/offering-chest.png';

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
  | 'dungeon-cage'
  | 'candle-stand'
  | 'offering-chest'
  | 'window'
  | 'hay-bale'
  | 'feed-trough'
  | 'well'
  | 'scarecrow'
  | 'farm-fence'
  | 'tavern-bar'
  | 'barstool'
  | 'ale-barrel'
  | 'fireplace'
  | 'dartboard'
  | 'cabin-bed'
  | 'wood-stove'
  | 'washbasin'
  | 'rocking-chair'
  | 'chest';

export type TileEnvironment = 'room' | 'garden' | 'church' | 'kitchen' | 'hallway' | 'dungeon' | 'royalRoom' | 'farm' | 'tavern' | 'cabin';

export const propsByEnvironment: Record<TileEnvironment, readonly PropAssetId[]> = {
  royalRoom: ['throne', 'formal-chair', 'window'],
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
    'window',
  ],
  church: ['church-pew', 'church-pew-left', 'church-pew-right', 'candle-stand', 'offering-chest', 'window'],
  dungeon: ['dungeon-cage', 'barrel-cluster', 'window'],
  garden: ['stone-planter', 'wooden-planter', 'window'],
  kitchen: [
    'kitchen-worktable',
    'kitchen-worktable-left',
    'kitchen-worktable-right',
    'barrel-cluster',
    'dining-table',
    'dining-table-left',
    'dining-table-right',
    'window',
  ],
  hallway: ['window'],
  farm: ['hay-bale', 'feed-trough', 'well', 'scarecrow', 'farm-fence', 'window'],
  tavern: ['tavern-bar', 'barstool', 'ale-barrel', 'fireplace', 'dartboard', 'barrel-cluster', 'window'],
  cabin: ['cabin-bed', 'wood-stove', 'washbasin', 'rocking-chair', 'chest', 'window'],
};

// A "seat" prop sits on an unblocked, legal cell — a character may be placed there, with the prop
// rendering under their avatar. A "decorative" prop stays on a permanently blocked/impassable cell.
export const propKindByAsset: Record<PropAssetId, 'seat' | 'decorative'> = {
  throne: 'seat',
  'formal-chair': 'seat',
  'simple-chair': 'seat',
  'wooden-bench': 'seat',
  'wooden-bench-left': 'seat',
  'wooden-bench-right': 'seat',
  'church-pew': 'seat',
  'church-pew-left': 'seat',
  'church-pew-right': 'seat',
  'stone-planter': 'decorative',
  'wooden-planter': 'decorative',
  'dining-table': 'decorative',
  'dining-table-left': 'decorative',
  'dining-table-right': 'decorative',
  'kitchen-worktable': 'decorative',
  'kitchen-worktable-left': 'decorative',
  'kitchen-worktable-right': 'decorative',
  'barrel-cluster': 'decorative',
  bookshelf: 'decorative',
  'bookshelf-left': 'decorative',
  'bookshelf-right': 'decorative',
  'dungeon-cage': 'decorative',
  'candle-stand': 'decorative',
  'offering-chest': 'decorative',
  window: 'decorative',
  'hay-bale': 'decorative',
  'feed-trough': 'decorative',
  'well': 'decorative',
  'scarecrow': 'decorative',
  'farm-fence': 'decorative',
  'tavern-bar': 'seat',
  'barstool': 'seat',
  'ale-barrel': 'decorative',
  'fireplace': 'decorative',
  'dartboard': 'decorative',
  'cabin-bed': 'seat',
  'wood-stove': 'decorative',
  'washbasin': 'decorative',
  'rocking-chair': 'seat',
  'chest': 'decorative',

};

// Groups asset variants that are the same "thing" in different skins/environments, for
// `shares-prop-category-neighbor` ("X and Y are each beside a plant" — not necessarily the same
// plant). Assets with no sibling variant map to their own id, which is already a unique category.
export const propCategoryByAsset: Record<PropAssetId, string> = {
  throne: 'throne',
  'formal-chair': 'formal-chair',
  'simple-chair': 'simple-chair',
  'wooden-bench': 'wooden-bench',
  'wooden-bench-left': 'wooden-bench',
  'wooden-bench-right': 'wooden-bench',
  'church-pew': 'church-pew',
  'church-pew-left': 'church-pew',
  'church-pew-right': 'church-pew',
  'stone-planter': 'planter',
  'wooden-planter': 'planter',
  'dining-table': 'dining-table',
  'dining-table-left': 'dining-table',
  'dining-table-right': 'dining-table',
  'kitchen-worktable': 'kitchen-worktable',
  'kitchen-worktable-left': 'kitchen-worktable',
  'kitchen-worktable-right': 'kitchen-worktable',
  'barrel-cluster': 'barrel-cluster',
  bookshelf: 'bookshelf',
  'bookshelf-left': 'bookshelf',
  'bookshelf-right': 'bookshelf',
  'dungeon-cage': 'dungeon-cage',
  'candle-stand': 'candle-stand',
  'offering-chest': 'offering-chest',
  window: 'window',
  'hay-bale': 'hay-bale',
  'feed-trough': 'feed-trough',
  'well': 'well',
  'scarecrow': 'scarecrow',
  'farm-fence': 'farm-fence',
  'tavern-bar': 'tavern-bar',
  'barstool': 'barstool',
  'ale-barrel': 'ale-barrel',
  'fireplace': 'fireplace',
  'dartboard': 'dartboard',
  'cabin-bed': 'cabin-bed',
  'wood-stove': 'wood-stove',
  'washbasin': 'washbasin',
  'rocking-chair': 'rocking-chair',
  'chest': 'chest',

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
    'candle-stand': candleStand,
    'offering-chest': offeringChest,
    // TODO(art): placeholder texture — swap for a real window sprite once sourced; see
    // docs/royal-inquest/authoring/board-rooms-props.human.md#asset-idea-not-yet-built.
    window: stonePlanter,
    'hay-bale': hayBale,
    'feed-trough': feedTrough,
    'well': well,
    'scarecrow': scarecrow,
    'farm-fence': farmFence,
    'tavern-bar': tavernBar,
    'barstool': barstool,
    'ale-barrel': aleBarrel,
    'fireplace': fireplace,
    'dartboard': dartboard,
    'cabin-bed': cabinBed,
    'wood-stove': woodStove,
    'washbasin': washbasin,
    'rocking-chair': rockingChair,
    'chest': chest,

  },
  marks: { manualCross, autoCross },
  tiles: {
    room: [roomTimber1, roomTimber2, roomTimber3],
    garden: [garden1, garden2, garden3],
    church: [churchStone1, churchStone2, churchStone3],
    kitchen: [kitchenFlagstone1, kitchenFlagstone2, kitchenFlagstone3],
    hallway: [hallwayStone1],
    dungeon: [dungeonMasonry1],
    royalRoom: [royalMarble1],
    farm: [farmDirt1, farmDirt2, farmDirt3],
    tavern: [tavernPlanks1, tavernPlanks2, tavernPlanks3],
    cabin: [cabinLog1, cabinLog2, cabinLog3],

  },
} as const satisfies {
  marks: { manualCross: string; autoCross: string };
  avatars: Record<AvatarAssetId, string>;
  props: Record<PropAssetId, string>;
  tiles: Record<TileEnvironment, readonly string[]>;
};
