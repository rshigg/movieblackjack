import { json, type LoaderArgs } from '@remix-run/node';
import { Link } from '@remix-run/react';
import { requireLobbyState } from '~/models/lobby.server';

export async function loader({ request, params: { code = '' } }: LoaderArgs) {
	await requireLobbyState(request, code);
	return json({});
}

export default function GameDone() {
	return (
		<div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8 lg:py-48">
			<h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Game Over</h1>
			<p className="text-4xl font-bold tracking-tight text-indigo-600 sm:text-5xl">
				{`{user}`} wins!
			</p>
			<div className="mt-6">
				<Link
					to="/"
					className="inline-flex items-center rounded-md border border-transparent bg-white bg-opacity-75 px-4 py-2 text-sm font-medium text-black text-opacity-75 sm:bg-opacity-25 sm:hover:bg-opacity-50"
				>
					Go back home
				</Link>
			</div>
		</div>
	);
}
