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
	/** @xstate-layout N4IgpgJg5mDOIC5RQIYFswDoAOAnMqGAxAAoAyAggJoCiASgPoBSA8gJIByNAIoqNgHtYASwAuwgQDs+IAB6IAtACYA7EswA2DQFY12pQAYAzAYCMKjQBoQAT0VGVmAytMGNADgAsRowE4V7i4aAL7B1oRYeAToYEQAygAqFHQJDADiFACyNDKCIuJSMvIICqbaTtq+Slrupu7+Kr7G1nYIngaYVUY1Jo1GtUqh4TGYsNhgAMaiKOKSUES5QmIS0khyiKpGThq+Otru7kampj4tiOZbnipqZjsaxgaDYSARmFAArnAic0RpAKo0OJxRb5FZFRD9dydfRKByNDxKA7aM4IbQGXyabQmOq+LweFRDF4jAAWYgUAlwClg0xsRAAEmwEiDloU1sVsZhDp5tDysVjPLUrLZEN5PJ1TBpvM50b4BU9hhhMKTROTKdSULTEtRmQVVqBispTOpEd0fL4Je4dOiUZ4jZhdGi6odDJ47oSIkRWJx0lkcms8iy9esEEZtKZMFcqhpTAKY0ZDMjhSUjeUdJ5qtzDgZKgd3TFSJRaIwyDQAGJM-1LXXg1EaRxlGNKNEBNxKTwohS6ToqAyHY6GR7ooyhZ6SAQQOAyV5RCI6sFsxSS+1Gzy+UN1tHZ9tJhSHTmWlT7c1lV0WPOKsaTaazKBz1n6kUaTQOdxKRH+XE7UwoiWOK7c-xLXqWoz2eV4Pi+YQ5jvIN2R7e0zDUJQJWzLkUSMdMnHcXsV0tfZsJCMCSTJCkqRpGCa3MKFcR8bMLDcc0BRRMMny0FD6hwsN5SJRUICkMAKIXEouIjZDXF6LxTH8G1rk0FR+nabw-G8bRzywAAzd4ABstMEh8ECksUvx8MS3AMW0Oy8TBIVbdMrhOYciIwPTg07bpROOB4AltaSd0MDENFhQcmmuXxfBHYIgA */
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
							target: 'hit-or-stay',
						},
					},
				},
				'hit-or-stay': {
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
