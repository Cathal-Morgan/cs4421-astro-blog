import { createHash } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import type { APIRoute } from 'astro';
import { readJsonBody, validateSuggestion } from '../../utils/suggestions';

const TABLE_NAME = process.env.SUGGESTIONS_TABLE_NAME;
const RECIPIENT_EMAIL = process.env.SUGGESTIONS_TO_EMAIL;
const SENDER_EMAIL = process.env.SUGGESTIONS_FROM_EMAIL;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ses = new SESv2Client({});

function jsonResponse(body: unknown, status = 200, headers: HeadersInit = {}) {
	return Response.json(body, {
		status,
		headers: { 'Cache-Control': 'no-store', ...headers },
	});
}

function logError(logger: { error: (message: string) => void }, event: string, error: unknown) {
	logger.error(
		JSON.stringify({
			event,
			error: error instanceof Error ? error.message : String(error),
		}),
	);
}

export const POST: APIRoute = async ({ request, clientAddress, logger }) => {
	if (!TABLE_NAME || !RECIPIENT_EMAIL || !SENDER_EMAIL) {
		logger.error('Suggestion email or rate-limit storage is not configured.');
		return jsonResponse({ error: 'Suggestions are temporarily unavailable.' }, 503);
	}

	if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
		return jsonResponse({ error: 'Send the form as JSON.' }, 415);
	}

	let body: Awaited<ReturnType<typeof readJsonBody>>;
	try {
		body = await readJsonBody(request);
	} catch (error) {
		logError(logger, 'suggestion_request_read_failed', error);
		return jsonResponse({ error: 'The request could not be read.' }, 400);
	}
	if (!body.success) {
		return jsonResponse({ error: body.message }, body.status);
	}

	if (typeof body.value === 'object' && body.value !== null && 'website' in body.value) {
		const website = body.value.website;
		if (typeof website === 'string' && website.trim()) {
			return jsonResponse({ success: true });
		}
	}

	const validation = validateSuggestion(body.value);
	if (!validation.success) {
		return jsonResponse({ error: validation.message }, 400);
	}

	const now = Date.now();
	const windowStart = Math.floor(now / RATE_WINDOW_MS);
	const retryAfter = Math.max(1, Math.ceil(((windowStart + 1) * RATE_WINDOW_MS - now) / 1000));
	const forwardedFor = request.headers.get('x-forwarded-for');
	const sourceAddress = forwardedFor?.split(',').at(-1)?.trim() || clientAddress;
	const addressHash = createHash('sha256').update(sourceAddress).digest('hex');
	const expiresAt = Math.ceil(((windowStart + 2) * RATE_WINDOW_MS) / 1000);

	try {
		await dynamo.send(
			new UpdateCommand({
				TableName: TABLE_NAME,
				Key: { itemId: `rate#${addressHash}#${windowStart}` },
				UpdateExpression: 'SET #count = if_not_exists(#count, :zero) + :one, #expiresAt = :expiresAt',
				ConditionExpression: 'attribute_not_exists(#count) OR #count < :limit',
				ExpressionAttributeNames: { '#count': 'submissionCount', '#expiresAt': 'expiresAt' },
				ExpressionAttributeValues: {
					':zero': 0,
					':one': 1,
					':limit': RATE_LIMIT,
					':expiresAt': expiresAt,
				},
			}),
		);
	} catch (error) {
		if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
			return jsonResponse(
				{ error: 'Too many suggestions submitted. Please try again later.' },
				429,
				{ 'Retry-After': String(retryAfter) },
			);
		}
		logError(logger, 'suggestion_rate_limit_failed', error);
		return jsonResponse({ error: 'Suggestions are temporarily unavailable.' }, 503);
	}

	try {
		const submittedAt = new Date(now).toISOString();
		await ses.send(
			new SendEmailCommand({
				FromEmailAddress: SENDER_EMAIL,
				Destination: { ToAddresses: [RECIPIENT_EMAIL] },
				Content: {
					Simple: {
						Subject: { Data: "New suggestion for Morgan's music board", Charset: 'UTF-8' },
						Body: {
							Text: {
								Data: [
									`Suggestion from: ${validation.value.displayName || 'Anonymous'}`,
									`Submitted: ${submittedAt}`,
									'',
									validation.value.text,
								].join('\n'),
								Charset: 'UTF-8',
							},
						},
					},
				},
			}),
		);

		return jsonResponse({ success: true, message: 'Thanks! Your suggestion was sent privately.' }, 201);
	} catch (error) {
		logError(logger, 'suggestion_email_failed', error);
		return jsonResponse({ error: 'Your suggestion could not be sent. Please try again later.' }, 503);
	}
};
