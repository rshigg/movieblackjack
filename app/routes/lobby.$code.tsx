import { redirect, json, type LoaderArgs, type ActionArgs } from '@remix-run/node';
import { Outlet, useLoaderData, Form, Link } from '@remix-run/react';

import { clearLobbySession, getLobbyState } from '~/models/lobby.server';

export async function loader({ request, params: { code } }: LoaderArgs) {
	if (!code) return redirect('/');

	// TODO: check if lobby exists
	const lobbyExists = true;
	if (!lobbyExists) {
		return redirect('/');
	}

	try {
		const { value, context } = await getLobbyState(request, code);
		return json({ value, context });
	} catch (error) {
		console.error(error);
		const headers = new Headers();
		headers.set('Set-Cookie', await clearLobbySession(request));
		return redirect('/', { headers });
	}
}

export async function action({ request }: ActionArgs) {
	if (process.env.NODE_ENV === 'development') {
		const headers = new Headers();
		headers.set('Set-Cookie', await clearLobbySession(request));
		return json(null, { headers });
	}
	return json(null);
}

export default function LobbyWrapper() {
	const state = useLoaderData<typeof loader>();

	return (
		<div className="min-h-screen flex flex-col">
			<nav className="p-2">
				<Link to="/">Home</Link>
				{process.env.NODE_ENV === 'development' && (
					<>
						<Form method="post">
							<button type="submit" name="type" value="reset" className="uppercase">
								Reset game
							</button>
						</Form>
						<code className="block p-2 bg-gray-100 rounded border-px">
							{JSON.stringify(state, null, 2)}
						</code>
					</>
				)}
			</nav>
			<main className="flex-1 flex flex-col">
				<Outlet />
			</main>
		</div>
	);
}
