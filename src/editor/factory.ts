import type { Doc, Part, Board } from '../geometry/types';
import { uid } from '../geometry/types';

export function defaultBoard(): Board {
  return { width: 2440, height: 1220, thickness: 18, material: '塑料板' };
}

export function createDoc(): Doc {
  const part: Part = {
    id: uid('p'),
    name: '板件 1',
    x: 40, y: 40,
    contours: [],
    holes: []
  };
  return { version: 1, board: defaultBoard(), parts: [part], activePartId: part.id };
}
