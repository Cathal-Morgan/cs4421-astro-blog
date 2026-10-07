import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ logger }) => {
	const timestamp = new Date().toISOString();
	logger.info(
		JSON.stringify({
			event: 'health_probe',
			probe: 'readiness',
			status: 'ready',
			timestamp,
		}),
	);

	return Response.json({
		status: 'ready',
		probe: 'readiness',
		timestamp,
	});
};