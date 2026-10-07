import type { APIRoute } from 'astro';

export const GET: APIRoute = () =>
	new Response(
		JSON.stringify({
			status: 'ok',
			probe: 'readiness',
			timestamp: new Date(),
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		},
	);
