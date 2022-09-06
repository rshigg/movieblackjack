import { json, redirect, type LoaderArgs, type ActionArgs } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';

import {
	clearLobbySession,
	getLobbyState,
	sendEventToLobby,
	updateLobbySession,
} from '~/models/lobby.server';
import { createNewPlayer } from '~/models/player.server';
import { LOBBY_ACTIONS } from '~/consts';
import type { Player } from '~/types/lobby';

type ActionFormData =
	| { type: 'reset' }
	| { type: typeof LOBBY_ACTIONS.JOIN_GAME; nickname: string }
	| { type: typeof LOBBY_ACTIONS.START_GAME };

export async function loader({ request, params: { code } }: LoaderArgs) {
	if (!code) return redirect('/');
	const headers = new Headers();
	const lobbyState = await getLobbyState(request, code);

	if (lobbyState.matches('pregame')) {
		const { players, currentPlayer } = lobbyState.context;
		const playerNeedsNickname = !players.find((player) => player.id === currentPlayer);
		return json({ playerNeedsNickname });
	}

	return redirect(`/lobby/${code}/${String(lobbyState.value)}`, { headers });
}

export async function action({ request, params: { code } }: ActionArgs) {
	if (!code) return redirect('/');

	const headers = new Headers();
	const formData = Object.fromEntries(await request.formData()) as ActionFormData;

	const currentState = await getLobbyState(request, code);

	if (formData.type === 'reset') {
		headers.set('Set-Cookie', await clearLobbySession(request));
		return json(null, { headers });
	}

	if (formData.type === LOBBY_ACTIONS.JOIN_GAME) {
		const { nickname } = formData;

		if (currentState.context.players.find((player) => player.nickname === nickname)) {
			return json({ error: 'Nickname already taken' });
		}

		const player: Player = createNewPlayer(nickname);
		const nextState = await sendEventToLobby(currentState, { type: 'JOIN_GAME', data: player });
		headers.set('Set-Cookie', await updateLobbySession(request, nextState));
		return json(null, { headers });
	}

	if (formData.type === LOBBY_ACTIONS.START_GAME) {
		const nextState = await sendEventToLobby(currentState, { type: 'START_GAME' });
		headers.set('Set-Cookie', await updateLobbySession(request, nextState));
		return json(null, { headers });
	}

	return null;
}

export default function Lobby() {
	const { playerNeedsNickname } = useLoaderData<typeof loader>();

	const pregameFetcher = useFetcher();

	const formContent = playerNeedsNickname ? (
		<>
			<label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
				Nickname
			</label>
			<input
				type="text"
				id="nickname"
				name="nickname"
				placeholder="Jack Black"
				className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
				required
			/>
			<div role="status" className="text-red-700 text-left text-sm px-1">
				{pregameFetcher.data?.error}
			</div>
			<button
				type="submit"
				name="type"
				value={LOBBY_ACTIONS.JOIN_GAME}
				className="mt-2 w-full shadow inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
			>
				Submit
			</button>
		</>
	) : (
		<button
			type="submit"
			name="type"
			value={LOBBY_ACTIONS.START_GAME}
			className="mt-2 w-full shadow inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
		>
			Start Game
		</button>
	);

	return (
		<div className="p-4">
			<pregameFetcher.Form method="post" className="max-w-sm">
				{formContent}
			</pregameFetcher.Form>
		</div>
	);
}
