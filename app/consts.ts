export const HOME_ACTIONS = {
	START_LOBBY: 'startLobby',
	JOIN_LOBBY: 'joinLobby',
} as const;

export const LOBBY_ACTIONS = {
	JOIN_GAME: 'joinGame',
	START_GAME: 'startGame',
} as const;

export const HIT_OR_STAY = ['HIT', 'STAY'] as const;
