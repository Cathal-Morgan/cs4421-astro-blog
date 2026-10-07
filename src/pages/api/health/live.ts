import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ logger }) => {
	const timestamp = new Date().toISOString();
	logger.info(
		JSON.stringify({
			event: 'health_probe',
			probe: 'liveness',
			status: 'ok',
			timestamp,
		}),
	);

	return Response.json({
		status: 'ok',
		probe: 'liveness',
		timestamp,
	});
};