import { createMachine, assign } from 'xstate';

import type { Lobby, Player, Guess } from '~/types/lobby';

const LOBBY_MAX_PLAYERS = 8;

function getNextPlayer({ players, activePlayer }: Lobby) {
	const activePlayerIndex = players.findIndex((player) => player.id === activePlayer);
	const newIndex =
		activePlayerIndex === -1 || activePlayerIndex + 1 >= players.length ? 0 : activePlayerIndex + 1;
	return players[newIndex].id;
}

export type Events =
	| { type: 'JOIN_GAME'; data: Player }
	| { type: 'PLAYER_JOINED'; data: Player }
	| { type: 'PLAYER_LEFT'; data: Player['id'] }
	| { type: 'START_GAME' }
	| ({ type: 'GUESS' } & Pick<Guess, 'movieId' | 'scoreGuess'>)
	| { type: 'HIT' }
	| { type: 'STAY' }
	| { type: 'GAME_FINISHED' };

export type LobbyContext = Lobby & {
	currentPlayer: Player['id'] | null;
};

export const defaultContext: LobbyContext = {
	code: '',
	players: [],
	activePlayer: null,
	currentPlayer: null,
};

export const lobbyMachine =
	/** @xstate-layout N4IgpgJg5mDOIC5RQIYFswDoAOAnMqGAxAAoAyAggJoCiASgPoBSA8gJIByNAIoqNgHtYASwAuwgQDs+IAB6IAjADYAzJgAMKlQA4A7OqUAmBQFYF2lQBoQAT0QBaQyoCcmZc-XqL29bufOAFgBfIOtCLDwCdDAiAGUAFQo6eIYAcQoAWRoZQRFxKRl5BEcA7UxDM2cTQyrTQJUTaztihTVDIxNtGqUfC0M9ELDozFhsMABjURRxSSgiHKExCWkkOUUFVw9DCu0TKoDdJWdtJsUAk0wAp1V1ANNdDc1BkHDMKABXOBFZolSAVRosViCzyy0KiCqmCOCju1wC6mc5iUpwQVzKJhUfm0PQUNS8z1eAAsxAACAS4EmwKY2IgACTY8RBSwKqyK-QurWM5xM5wsARUyNsiAaukuJl0AoO235ASUBOGxNEZIpVJQNIS1CZ+RWoCK9nMhkw+iuSiOpW0ykFzSUMI04r0uMMAQOOnlxFYnDSmWyq1yzJ1awQDQUlz87RhFv5hnUjSFLQqUJ57V5Khjx20bpi5Go9AYZBoADFGb7FtrwQhAlC7pG7gY7nsUfZnZtdNGXCpWloM89JAIIHAZK9IuEtWDWQ5o651MYTOpWhZxQ9dI37m4FAYbUp9OYVKVMyMxpNpsJZqOWbrEGZys4-DftmZxVoUZsFOZZ9GlOdDLoLPuPl8TygM8AyKPRyl3FxtFKTRZ1xFEVBqI0AiqQJqiUPYan3RVlUpalgPLCoQ3hZxVB5IwlBjdCUQxC4SJtW5jDfJ5QheYYICkMB8PHBAnRDfwtDMCpOiMCoUS3EMLAg-kOwsGN9wAM3eAAbJSuIvBANgCKFES0RiDFuBRGygzAdB8IwrgOTtMzUwNHFbcpKmqWo9mdRsELUdxPGOK4HnOOUQiCIA */
	createMachine(
		{
			context: defaultContext,
			tsTypes: {} as import('./lobbyMachine.typegen').Typegen0,
			schema: { context: {} as LobbyContext, events: {} as Events },
			predictableActionArguments: true,
			id: 'game',
			initial: 'pregame',
			on: {
				JOIN_GAME: [
					{
						cond: 'lobbyIsFull',
						target: '.full',
					},
					{
						actions: ['setCurrentPlayer', 'playerJoined'],
					},
				],
				PLAYER_LEFT: {
					actions: 'playerLeft',
				},
			},
			states: {
				pregame: {
					tags: 'pause',
					on: {
						PLAYER_JOINED: {
							actions: 'playerJoined',
						},
						START_GAME: {
							actions: 'advanceActivePlayer',
							target: 'spectating',
						},
					},
				},
				spectating: {
					tags: 'pause',
					always: {
						cond: 'currentPlayerIsActive',
						target: 'guessing',
					},
				},
				guessing: {
					tags: 'pause',
					on: {
						GUESS: {
							target: 'hit or stay',
						},
					},
				},
				'hit or stay': {
					tags: 'pause',
					on: {
						HIT: {
							target: 'guessing',
						},
						STAY: [
							{
								cond: 'isLastGuess',
								target: 'done',
							},
							{
								actions: 'advanceActivePlayer',
								target: 'spectating',
							},
						],
					},
				},
				done: {
					entry: 'calculateWinner',
					type: 'final',
				},
				full: {
					type: 'final',
				},
			},
		},
		{
			actions: {
				setCurrentPlayer: assign((_, event) => ({ currentPlayer: event.data.id })),
				playerJoined: assign((ctx, event) => ({ players: [...ctx.players, event.data] })),
				playerLeft: assign((ctx, event) => {
					const leavingPlayerId = event.data;
					let newActivePlayer = ctx.activePlayer;
					const newPlayers = ctx.players.filter((player) => player.id !== leavingPlayerId);
					if (leavingPlayerId === ctx.activePlayer) {
						newActivePlayer = getNextPlayer(ctx);
					}
					return { players: newPlayers, activePlayer: newActivePlayer };
				}),
				advanceActivePlayer: assign((ctx) => ({ activePlayer: getNextPlayer(ctx) })),
				calculateWinner: () => {},
			},
			guards: {
				lobbyIsFull: (ctx) => ctx.players.length === LOBBY_MAX_PLAYERS,
				currentPlayerIsActive: (ctx) => ctx.activePlayer === ctx.currentPlayer,
				isLastGuess: (ctx) => ctx.players.at(-1)?.id === ctx.activePlayer,
			},
			services: {},
		}
	);
