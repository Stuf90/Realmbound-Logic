import type { RoyalInquestLevel } from '../types';
import { definition as easy02Definition, skin as easy02Skin, title as easy02Title } from './easy-02';
import { definition as easy13Definition, skin as easy13Skin, title as easy13Title } from './easy-13';
import { definition as easy01Definition, skin as easy01Skin, title as easy01Title } from './easy-01';
import { definition as easy14Definition, skin as easy14Skin, title as easy14Title } from './easy-14';
import { definition as easy04Definition, skin as easy04Skin, title as easy04Title } from './easy-04';

export const royalInquestLevels: RoyalInquestLevel[] = [
  { id: easy02Definition.id, title: easy02Title, definition: easy02Definition, skin: easy02Skin },
  { id: easy13Definition.id, title: easy13Title, definition: easy13Definition, skin: easy13Skin },
  { id: easy01Definition.id, title: easy01Title, definition: easy01Definition, skin: easy01Skin },
  { id: easy14Definition.id, title: easy14Title, definition: easy14Definition, skin: easy14Skin },
  { id: easy04Definition.id, title: easy04Title, definition: easy04Definition, skin: easy04Skin },
];
