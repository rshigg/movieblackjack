import type { MetaFunction } from '@remix-run/node';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';

import twStyles from '~/styles/tailwind.css';

export const links = () => [{ rel: 'stylesheet', href: twStyles }];

export const meta: MetaFunction = () => ({
	charset: 'utf-8',
	title: 'Movie Blackjack',
	viewport: 'width=device-width,initial-scale=1',
});

export default function App() {
	return (
		<html lang="en" className="h-full">
			<head>
				<Meta />
				<Links />
			</head>
			<body className="min-h-screen">
				<Outlet />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	);
}
