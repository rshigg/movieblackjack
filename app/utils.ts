const tmdbImageBaseURL = 'https://image.tmdb.org/t/p';

export const getTMDBImagePath = (path: string, width: number | 'original' = 'original') =>
	`${tmdbImageBaseURL}/${width === 'original' ? width : `w${width}`}${path}`;

export const random = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;
