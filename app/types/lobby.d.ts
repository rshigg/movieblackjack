export type Guess = {
	movieId: string;
	scoreGuess: number;
	actualScore: number;
};

export type Player = {
	id: string;
	name: string;
	guesses: Guess[];
};

export type Lobby = {
	code: string;
	players: Player[];
	activePlayer: Player['id'] | null;
};
