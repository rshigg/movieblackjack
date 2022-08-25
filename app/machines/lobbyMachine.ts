import { createMachine, assign } from 'xstate';

import type { Lobby, Player } from '~/types/lobby';

function getNextPlayer({ players, activePlayer }: Lobby) {
	const activePlayerIndex = players.findIndex((player) => player.id === activePlayer);
	const newIndex =
		activePlayerIndex === -1 || activePlayerIndex + 1 >= players.length ? 0 : activePlayerIndex + 1;
	return players[newIndex].id;
}

type Events =
	| { type: 'PLAYER_JOINED'; data: Player }
	| { type: 'PLAYER_LEFT'; data: Player['id'] }
	| { type: 'START_GAME' }
	| { type: 'GUESS'; data?: number }
	| { type: 'HIT' }
	| { type: 'STAY' }
	| { type: 'GAME_FINISHED' };

type Context = Lobby & {
	currentPlayerId: string;
};

export const lobbyMachine =
	/** @xstate-layout N4IgpgJg5mDOIC5RQIYFswDoAOAnMqGAxAAoAyAggJoCiASgPoBSA8gJIByNAIoqNgHtYASwAuwgQDs+IAB6IATAAYAHJgAsAdiUA2BQEYArEoDMATiVn9+gDQgAnogC0JzZgWaV+3erMmVHjpGAL7BdoRYeAToYEQAygAqFHQJDADiFACyNDKCIuJSMvIITp6YhipKhgpa6hWaOiaGdo4IOoaYStYm6gpWNfqeZqHhMZjCkgAEeAJQ+LCwmLDYYADGoijiklBEuUJiEtJIcs6GZuqYKhU1Jl3qvVotiO2d3b396oMqw2EgEeNTGZzOCLKAAVxBEx2aQAqjQ4nE9vlDkVnCZ0ZgdDp1HpGjolDUzk8ELd9J18e0AjoGkpPCYRn8xhNprhZvNFgALMSTAS4SawDb2IgACTYCSRB0Kx2KLgUCk65iCZnaBOqtgciEGbkMnlp1J032xChUDP+zKB7MwXNEPL5ApQQsS1AlBSOoGK6hMmIqnt6SnUBIN-uJtzMmOxmk0WmVFn0OlNTMBrOBCyIGWyDAAYpw2HFhTwXSjpc5fDpMPozHLTCZ9DXTGZidUy1jI658RW+gniORqPQGGQaJnxcc8pK3ScEFoOk1zFpvH10TpibWy98cTjVAYDWYTQzJAIIHAZP8ohFC1L3Yo1GYzNp-CpNCYsYYaypiU5b51jfiTMpNNY-y7LBzWTS1ljWDYtigc9xxlTQDA0FQ9F8J98U9ZoNRKfxOkMCpaxqG8zn0ICARZNkQUwcFIW2GDURKT01ECe59BUSpeijJdMIUHpMFvQwA0ff1Kh0c4SJA8iFitbleX5QVaOLEoajUeDlX0ANsR6HEFGJbiLj4gTbnUYTRN+M0kwk+AR32V06NKOpEOQvwsX9Jp3zjMkqmubwzkrXQFBIiApDAeTL0UnVeM0aoA2sfj0W0zD8TUIJ9AUQwDTQm8flGDAQonUoRIcgjUJcjDWicbivU8gIjJxNKkPUUJQiAA */
	createMachine(
		{
			context: { code: '', players: [], activePlayer: null, currentPlayerId: '' },
			tsTypes: {} as import('./lobbyMachine.typegen').Typegen0,
			schema: { context: {} as Context, events: {} as Events },
			predictableActionArguments: true,
			id: 'game',
			initial: 'pregame',
			on: {
				PLAYER_LEFT: {
					actions: 'playerLeft',
				},
			},
			states: {
				pregame: {
					on: {
						PLAYER_JOINED: {
							actions: 'playerJoined',
						},
						START_GAME: {
							target: 'in progress',
						},
					},
				},
				'in progress': {
					entry: 'advanceActivePlayer',
					initial: 'spectating',
					states: {
						spectating: {
							always: {
								cond: 'currentPlayerIsActive',
								target: 'guessing',
							},
						},
						guessing: {
							on: {
								GUESS: {
									target: 'hit or stay',
								},
							},
						},
						'hit or stay': {
							on: {
								HIT: {
									target: 'guessing',
								},
								STAY: [
									{
										cond: 'isLastGuess',
										target: '#game.done',
									},
									{
										actions: 'advanceActivePlayer',
										target: 'spectating',
									},
								],
							},
						},
					},
					on: {
						GAME_FINISHED: {
							target: 'done',
						},
					},
				},
				done: {
					entry: 'calculateWinner',
					type: 'final',
				},
			},
		},
		{
			actions: {
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
				currentPlayerIsActive: (ctx) => ctx.activePlayer === ctx.currentPlayerId,
				isLastGuess: (ctx) => ctx.players.at(-1)?.id === ctx.activePlayer,
			},
		}
	);
