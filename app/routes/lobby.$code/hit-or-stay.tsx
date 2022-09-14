import { type ActionArgs, json, type LoaderArgs, redirect } from '@remix-run/node';
import { Form } from '@remix-run/react';

import {
	requireLobbyState,
	getLobbyState,
	sendEventToLobby,
	updateLobbySession,
} from '~/models/lobby.server';
import { HIT_OR_STAY } from '~/consts';

export async function loader({ request, params: { code } }: LoaderArgs) {
	await requireLobbyState(request, code);
	return json({});
}

type ActionFormData = { type: typeof HIT_OR_STAY[number] };

export async function action({ request, params: { code = '' } }: ActionArgs) {
	const state = await getLobbyState(request, code);
	const { type } = Object.fromEntries(await request.formData()) as ActionFormData;
	const headers = new Headers();

	const nextState = await sendEventToLobby(state, { type });

	headers.set('Set-Cookie', await updateLobbySession(request, nextState));

	return redirect(`/lobby/${code}/${String(nextState.value)}`, { headers });
}

export default function HitOrStay() {
	return (
		<div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8 lg:py-48">
			<h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Hit or Stay</h1>
			<Form method="post" className="mt-5 sm:mt-6 flex gap-3">
				<button
					type="submit"
					name="type"
					value={HIT_OR_STAY[0]}
					className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
				>
					Hit
				</button>
				<button
					type="submit"
					name="type"
					value={HIT_OR_STAY[1]}
					className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
				>
					Stay
				</button>
			</Form>
		</div>
	);
}
