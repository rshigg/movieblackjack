import * as React from 'react';
import { type ActionArgs, json, type LoaderArgs, redirect } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';

import { getRandomMovie } from '~/models/movies.server';
import {
	getLobbyState,
	requireLobbyState,
	sendEventToLobby,
	updateLobbySession,
} from '~/models/lobby.server';
import { getTMDBImagePath } from '~/utils';

const descriptionEmptyState = <span className="italic">Sorry, no description ¯\_(ツ)_/¯</span>;

export async function loader({ request, params: { code } }: LoaderArgs) {
	await requireLobbyState(request, code);

	const movieData = await getRandomMovie();
	return json(movieData);
}

type ActionData = { guess: string };

export async function action({ request, params: { code = '' } }: ActionArgs) {
	const { guess } = Object.fromEntries(await request.formData()) as ActionData;
	const state = await getLobbyState(request, code);
	const headers = new Headers();

	const guessAsNum = Number(guess);
	// constrain guess to between 0 and 10
	const scoreGuess = isNaN(guessAsNum) || guessAsNum < 0 ? 0 : Math.min(guessAsNum, 10);

	const nextState = await sendEventToLobby(state, { type: 'GUESS', movieId: '', scoreGuess });

	headers.set('Set-Cookie', await updateLobbySession(request, nextState));

	return redirect(`/lobby/${code}/${String(nextState.value)}`, { headers });
}

export default function Guessing() {
	const { movie, cast } = useLoaderData<typeof loader>();

	const title = `${movie.title}${
		movie.original_title !== movie.title ? ` (${movie.original_title})` : ''
	}`;

	const portraits = React.useMemo(
		() =>
			cast
				?.filter(({ profile_path }) => !!profile_path)
				.slice(0, 4)
				.map(({ id, name, profile_path }) => (
					<div key={id} className="col-span-1 rounded-lg overflow-hidden shadow border">
						<img
							src={getTMDBImagePath(profile_path, 200)}
							alt={name}
							title={name}
							width="200"
							height="200"
							className="w-full h-auto aspect-square object-center object-cover"
							onError={(e) => e.currentTarget.remove()}
						/>
					</div>
				)),
		[cast]
	);

	const posterSwapped = React.useRef(false);

	const swapPoster: React.ReactEventHandler<HTMLImageElement> = () => {
		// TODO: re-enable when typescript has built-in Connection types
		// 	const { effectiveType: network = '4g', saveData = false } = navigator.connection || {};
		// 	if (!posterSwapped.current && network === '4g' && !saveData) {
		// 		e.currentTarget.src = getTMDBImagePath(movie.poster_path);
		// 	}
		posterSwapped.current = true;
	};

	return (
		<div className="flex-1 max-w-2xl mx-auto py-8 px-4 sm:py-10 sm:px-6 lg:max-w-7xl lg:px-8 grid grid-cols-1 lg:grid-cols-2 lg:gap-x-8 lg:max-h-full place-content-center">
			{/* Movie details */}
			<div className="lg:max-w-lg lg:self-end space-y-3">
				<h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:tracking-tight sm:text-4xl">
					{title}
				</h1>
				<p className="text-base text-gray-500">{movie.overview || descriptionEmptyState}</p>
				<span>{movie.vote_average}</span>
				<div className="grid grid-cols-4 gap-3">{portraits}</div>
			</div>

			{/* Rating form */}
			<div className="mt-6 lg:max-w-lg lg:col-start-1 lg:row-start-2 lg:self-start">
				<Form method="post" className="space-y-2">
					<label htmlFor="rating-guess" className="block text-lg font-medium text-gray-700">
						Guess the rating
					</label>
					<input
						type="text"
						id="rating-guess"
						name="guess"
						className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
					/>
					<button
						type="submit"
						className="w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-indigo-500"
					>
						Submit
					</button>
				</Form>
			</div>

			{/* Movie poster */}
			<div className="mx-auto mt-10 lg:mt-0 lg:col-start-2 lg:row-span-2 lg:self-center">
				<img
					src={getTMDBImagePath(movie.poster_path)}
					alt=""
					width="300"
					height="450"
					className="w-full h-auto max-w-md"
					onLoad={swapPoster}
				/>
			</div>
		</div>
	);
}
