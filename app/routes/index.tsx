import { type ActionFunction, json } from '@remix-run/node';
import { Form } from '@remix-run/react';

import { createLobby, joinLobby } from '~/models/lobby.server';
import { HOME_ACTIONS } from '~/consts';

type ActionFormData =
	| { type: typeof HOME_ACTIONS.START_LOBBY }
	| { type: typeof HOME_ACTIONS.JOIN_LOBBY; code: string };

export const action: ActionFunction = async ({ request }) => {
	const formData = Object.fromEntries(await request.formData()) as ActionFormData;
	const { type } = formData;

	if (type === HOME_ACTIONS.START_LOBBY) {
		return createLobby();
	}

	if (type === HOME_ACTIONS.JOIN_LOBBY) {
		const { code } = formData;
		return joinLobby(code);
	}

	return json(null);
};

export default function Index() {
	return (
		<div className="min-h-screen flex flex-col justify-center">
			<div className="flex flex-col items-center max-w-7xl mx-auto text-center py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
				<h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl sm:tracking-tight">
					Movie Blackjack
				</h1>
				<p className="max-w-xl mx-auto text-xl text-gray-500">Guess the scores and don't bust!</p>
				<div className="mt-8 flex flex-col items-center gap-4 w-full max-w-xs">
					<Form method="post" className="px-2 w-full">
						<button
							type="submit"
							name="type"
							value={HOME_ACTIONS.START_LOBBY}
							className="w-full shadow inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
						>
							Start a lobby
						</button>
					</Form>
					<hr className="w-full border-b-px border-gray-200" />
					<Form method="post" className="w-full px-2">
						<label htmlFor="lobby-code" className="sr-only">
							Lobby code
						</label>
						<input
							type="text"
							id="lobby-code"
							name="code"
							placeholder="ABCD1234"
							className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
						/>
						<button
							type="submit"
							name="type"
							value={HOME_ACTIONS.JOIN_LOBBY}
							className="mt-2 w-full shadow inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
						>
							Join a lobby
						</button>
					</Form>
				</div>
			</div>
		</div>
	);
}
