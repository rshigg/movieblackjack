import { nanoid } from 'nanoid';

import type { Player } from '~/types/lobby';

export function createNewPlayer(nickname: Player['nickname']): Player {
	const id = nanoid(8);
	return { id, nickname, guesses: [] };
}
