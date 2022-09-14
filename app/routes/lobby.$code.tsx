import * as React from 'react';
import { redirect, json, type LoaderArgs, type ActionArgs } from '@remix-run/node';
import { Outlet, useLoaderData, Form, Link, useParams } from '@remix-run/react';

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

const HomeIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 512 512"
		className="w-[1em] h-[1em] fill-current motion-safe:group-hover:animate-pulse"
	>
		<path d="M0 96a64 64 0 0 1 64-64h384a64 64 0 0 1 64 64v320a64 64 0 0 1-64 64H64a64 64 0 0 1-64-64V96zm48 272v32a16 16 0 0 0 16 16h32a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16H64a16 16 0 0 0-16 16zm368-16a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h32a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16h-32zM48 240v32a16 16 0 0 0 16 16h32a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16H64a16 16 0 0 0-16 16zm368-16a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h32a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16h-32zM48 112v32a16 16 0 0 0 16 16h32a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16H64a16 16 0 0 0-16 16zm368-16a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h32a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16h-32zm-256 32v64a32 32 0 0 0 32 32h128a32 32 0 0 0 32-32v-64a32 32 0 0 0-32-32H192a32 32 0 0 0-32 32zm32 160a32 32 0 0 0-32 32v64a32 32 0 0 0 32 32h128a32 32 0 0 0 32-32v-64a32 32 0 0 0-32-32H192z" />
	</svg>
);

export default function LobbyWrapper() {
	const state = useLoaderData<typeof loader>();
	const { code } = useParams();

	const [showDebug, setShowDebug] = React.useState(false);

	const toggleDebug = () =>
		setShowDebug(process.env.NODE_ENV === 'development' ? !showDebug : false);

	return (
		<div className="min-h-screen flex flex-col">
			<nav className="py-2 bg-white shadow-sm">
				<div className="flex items-center mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<Link
						to="/"
						className="group flex items-center gap-1 font-bold uppercase transition-colors hover:text-indigo-600"
					>
						<HomeIcon /> Home
					</Link>
					<span className="ml-auto text-xl uppercase font-mono text-indigo-600">{code}</span>
					{process.env.NODE_ENV === 'development' && (
						<button onClick={toggleDebug}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 640 512"
								className="w-5 h-5 ml-4"
							>
								<path d="m196.5 107.4 33.4-73.5A24 24 0 0 0 186.2 14L160 71.7l-26.1-57.6c-5.5-12.1-19.8-17.4-31.8-12s-17.4 19.8-12 31.8l33.4 73.5a64.3 64.3 0 0 0-22.9 28.6h-17l-4.1-20.7a24 24 0 1 0-47 9.4l8 40A24 24 0 0 0 64 184h32v23.3l-37.8 9.5a23.8 23.8 0 0 0-17.9 19.9l-8 56a24 24 0 1 0 47.6 6.8l5.7-40 18.4-4.6a63.8 63.8 0 0 0 112.1-.1l18.4 4.6 5.7 40a24 24 0 1 0 47.6-6.8l-8-56a24 24 0 0 0-17.9-19.9l-37.9-9.4V184h32a24 24 0 0 0 23.5-19.3l8-40a24 24 0 1 0-47-9.4l-4.2 20.7h-17a64.3 64.3 0 0 0-22.9-28.6zM528 286.5l65.6-47a24 24 0 0 0-27.9-39.1l-51.4 36.8 6.1-62.9a24 24 0 1 0-47.8-4.6l-7.8 80.3a64.1 64.1 0 0 0-34.1 13.3l-14.7-8.5 6.8-20a24 24 0 0 0-45.4-15.4L364.3 258a24 24 0 0 0 10.7 28.5l27.7 16-11.7 20.2-37.5-10.7a24 24 0 0 0-25.5 8.3l-34.9 44.5c-8.2 10.4-6.4 25.5 4.1 33.7s25.5 6.4 33.7-4.1l25-31.8 18.2 5.2a64 64 0 0 0 97.2 56.1l13.6 13.2-15.1 37.5a24 24 0 0 0 44.5 17.9l21.2-52.5a24 24 0 0 0-5.6-26.2l-28-27.1 11.6-20.1 27.7 16a24 24 0 0 0 30-4.9l27-30.7a24 24 0 0 0-36.1-31.7l-13.9 15.9-14.7-8.5c1.7-12.4-.2-25-5.5-36.2z" />
							</svg>
						</button>
					)}
				</div>
			</nav>
			{showDebug && (
				<div className="bg-gray-100 p-4 border-px">
					<Form method="post">
						<button type="submit" name="type" value="reset" className="uppercase">
							Reset game
						</button>
					</Form>
					<code className="block">{JSON.stringify(state, null, 2)}</code>
				</div>
			)}
			<main className="flex-1 flex flex-col">
				<Outlet />
			</main>
		</div>
	);
}
