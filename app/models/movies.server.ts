import invariant from 'tiny-invariant';
import type { MovieDetails, Credits } from 'tmdb-ts';

import { random } from '~/utils';

invariant(process.env.MOVIE_DB_API_KEY, 'Missing TMDB API key');

const API_BASE_URL = 'https://api.themoviedb.org/3';

export function headersWithAuthorization() {
	const headers = new Headers();
	headers.set('Authorization', `Bearer ${process.env.MOVIE_DB_API_KEY}`);
	headers.set('Content-Type', `application/json;charset=utf-8`);
	return headers;
}

async function getMovieCredits(movie: MovieDetails) {
	const headers = headersWithAuthorization();

	const res = await fetch(`${API_BASE_URL}/movie/${movie.id}/credits`, {
		headers,
	});

	return (await res.json()) as Credits;
}

export async function getRandomMovie() {
	const headers = headersWithAuthorization();

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
	const { cast } = await getMovieCredits(movie);

	return { movie, cast };
}
