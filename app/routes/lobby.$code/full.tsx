import { Link } from '@remix-run/react';

export default function LobbyFull() {
	return (
		<div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8 lg:py-48">
			<img
				src="https://images.unsplash.com/photo-1545972154-9bb223aac798?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=3050&q=80&exp=8&con=-15&sat=-75"
				alt=""
				className="fixed inset-0 -z-10"
			/>
			<h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">Lobby full.</h1>
			<p className="mt-2 text-lg font-medium text-black/80">
				The maximum number of players allowed per game have joined this lobby.
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
