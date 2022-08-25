import { redirect } from '@remix-run/node';
import { customAlphabet } from 'nanoid/async';

const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

export async function createLobby() {
	const code = await nanoid();
	return redirect(`/lobby/${code}`);
}

export async function joinLobby(code: string) {
	return redirect(`/lobby/${code}`);
}
