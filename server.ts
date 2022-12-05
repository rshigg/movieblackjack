import path from 'path';
import { createServer } from 'http';
import fs from 'fs';

import express from 'express';
import { Server } from 'socket.io';
import compression from 'compression';
import morgan from 'morgan';
import { createRequestHandler } from '@remix-run/express';

const MODE = process.env.NODE_ENV;
const BUILD_DIR = path.join(process.cwd(), 'build');

if (!fs.existsSync(BUILD_DIR)) {
	console.warn(
		"Build directory doesn't exist, please run `npm run dev` or `npm run build` before starting the server."
	);
}

const app = express();

// You need to create the HTTP server from the Express app
const httpServer = createServer(app);

// And then attach the socket.io server to the HTTP server
const io = new Server(httpServer);

// Then you can use `io` to listen the `connection` event and get a socket
// from a client
io.on('connection', (socket) => {
	// from this point you are on the WS connection with a specific client
	console.log(socket.id, 'connected');

	socket.emit('confirmation', 'connected!');

	socket.on('event', (data) => {
		console.log(socket.id, data);
		socket.emit('event', 'pong');
	});
});

app.use((req, res, next) => {
	// helpful headers:
	res.set('x-fly-region', process.env.FLY_REGION ?? 'unknown');
	res.set('Strict-Transport-Security', `max-age=${60 * 60 * 24 * 365 * 100}`);

	// /clean-urls/ -> /clean-urls
	if (req.path.endsWith('/') && req.path.length > 1) {
		const query = req.url.slice(req.path.length);
		const safepath = req.path.slice(0, -1).replace(/\/+/g, '/');
		res.redirect(301, safepath + query);
		return;
	}
	next();
});

// if we're not in the primary region, then we need to make sure all
// non-GET/HEAD/OPTIONS requests hit the primary region rather than read-only
// Postgres DBs.
// learn more: https://fly.io/docs/getting-started/multi-region-databases/#replay-the-request
app.all('*', function getReplayResponse(req, res, next) {
	const { method, path: pathname } = req;
	const { PRIMARY_REGION, FLY_REGION } = process.env;

	const isMethodReplayable = !['GET', 'OPTIONS', 'HEAD'].includes(method);
	const isReadOnlyRegion = FLY_REGION && PRIMARY_REGION && FLY_REGION !== PRIMARY_REGION;

	const shouldReplay = isMethodReplayable && isReadOnlyRegion;

	if (!shouldReplay) {
		return next();
	}

	const logInfo = {
		pathname,
		method,
		PRIMARY_REGION,
		FLY_REGION,
	};
	console.info('Replaying:', logInfo);
	res.set('fly-replay', `region=${PRIMARY_REGION}`);
	return res.sendStatus(409);
});

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

// Remix fingerprints its assets so we can cache forever.
app.use('/build', express.static('public/build', { immutable: true, maxAge: '1y' }));

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static('public', { maxAge: '1h' }));

app.use(morgan('tiny'));

app.all(
	'*',
	MODE === 'production'
		? createRequestHandler({ build: require(BUILD_DIR) })
		: (...args) => {
				purgeRequireCache();
				const requestHandler = createRequestHandler({
					build: require(BUILD_DIR),
					mode: MODE,
				});
				return requestHandler(...args);
		  }
);

const port = process.env.PORT || 3000;

// instead of running listen on the Express app, do it on the HTTP server
httpServer.listen(port, () => {
	console.log(`✅ app ready: http://localhost:${port}`);
});

function purgeRequireCache() {
	// purge require cache on requests for "server side HMR" this won't let
	// you have in-memory objects between requests in development,
	// alternatively you can set up nodemon/pm2-dev to restart the server on
	// file changes, we prefer the DX of this though, so we've included it
	// for you by default
	for (const key in require.cache) {
		if (key.startsWith(BUILD_DIR)) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete require.cache[key];
		}
	}
}
