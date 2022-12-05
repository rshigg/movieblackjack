import { createCookieSessionStorage, json, redirect } from '@remix-run/node';
import { customAlphabet } from 'nanoid/async';
import type { AnyState } from 'xstate';

import { asyncInterpret } from '~/machines/asyncInterpret';
import { defaultContext, lobbyMachine, type Events } from '~/machines/lobbyMachine';

const LOBBY_CODE_LENGTH = 8;
const lobbyCodeRegex = new RegExp(`[0-9a-z]{${LOBBY_CODE_LENGTH}}`, 'i');
const generateLobbyCode = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', LOBBY_CODE_LENGTH);

export const lobbyCookie = createCookieSessionStorage({
	cookie: {
		name: 'lobby',
		secrets: [process.env.LOBBY_SECRET as string],
		sameSite: 'lax',
	},
});

export async function getLobbySession(request: Request, lobbyCode: string = '') {
	const cookieHeader = request.headers.get('Cookie');
	const session = await lobbyCookie.getSession(cookieHeader);
	const currentState = session.get('state');
	// if there is no lobby state in session storage initialize it
	if (!currentState) {
		const newState = await asyncInterpret(
			lobbyMachine.withContext({ ...defaultContext, code: lobbyCode }),
			3_000
		);
		session.set('state', newState);
	}
	return session;
}

export async function updateLobbySession(request: Request, newState: AnyState) {
	const session = await getLobbySession(request);
	session.set('state', newState);
	return await lobbyCookie.commitSession(session);
}

export async function clearLobbySession(request: Request) {
	const session = await getLobbySession(request);
	return await lobbyCookie.destroySession(session);
}

export async function getLobbyState(request: Request, code: string) {
	const session = await getLobbySession(request, code);
	return lobbyMachine.resolveState(session.get('state'));
}

export async function requireLobbyState(request: Request, code?: string) {
	if (!code) throw redirect('/');

	const url = new URL(request.url).toString();
	const state = await getLobbyState(request, code);

	if (!(url.endsWith(String(state.value)) && state)) {
		throw redirect(`/lobby/${code}`);
	}

	return state;
}

export async function sendEventToLobby(currentState: AnyState, event: Events) {
	return await asyncInterpret(lobbyMachine, 3_000, currentState, event);
}

export async function createLobby() {
	const code = await generateLobbyCode();
	// TODO: create actual lobby
	return redirect(`/lobby/${code}`);
}

export async function joinLobby(code: string) {
	if (!lobbyCodeRegex.test(code)) {
		return json({ error: 'Invalid lobby code' });
	}

	// TODO: actually check if lobby code exists
	if (/12345678/i.test(code)) {
		return json({ error: 'Lobby does not exist' });
	}

	return redirect(`/lobby/${code.toUpperCase()}`);
}
