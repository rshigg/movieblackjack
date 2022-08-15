import type { AppLoadContext } from '@remix-run/cloudflare';
import type { MovieDetails, Credits } from 'tmdb-ts';

import { random } from '~/utils';

const API_BASE_URL = 'https://api.themoviedb.org/3';

export function headersWithAuthorization(context: AppLoadContext) {
	const headers = new Headers();
	headers.set('Authorization', `Bearer ${context.MOVIE_DB_API_KEY}`);
	headers.set('Content-Type', `application/json;charset=utf-8`);
	return headers;
}

async function getMovieCredits(context: AppLoadContext, movie: MovieDetails) {
	const headers = headersWithAuthorization(context);

	const res = await fetch(`${API_BASE_URL}/movie/${movie.id}/credits`, {
		headers,
	});

	return (await res.json()) as Credits;
}

export async function getRandomMovie(context: AppLoadContext) {
	const headers = headersWithAuthorization(context);

	const params = new URLSearchParams();
	params.set('sort_by', 'popularity.asc');
	params.set('vote_average.gte', '0.1');
	params.set('vote_count.gte', '100');
	params.set('page', String(random(1, 500)));

	const res = await fetch(`${API_BASE_URL}/discover/movie?${params.toString()}`, {
		headers,
	});

	const { results } = (await res.json()) as { results: MovieDetails[] };
	const movie = results[random(0, results.length - 1)];
	const { cast } = await getMovieCredits(context, movie);

	return { movie, cast };
}
