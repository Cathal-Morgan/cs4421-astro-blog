export const MAX_SUGGESTION_LENGTH = 1200;
export const MAX_DISPLAY_NAME_LENGTH = 60;
export const MAX_REQUEST_BYTES = 8192;

export interface SuggestionInput {
	text: string;
	displayName: string;
}

export type SuggestionValidation =
	| { success: true; value: SuggestionInput }
	| { success: false; message: string };

export function validateSuggestion(value: unknown): SuggestionValidation {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return { success: false, message: 'Submit a valid suggestion.' };
	}

	if (!('text' in value) || typeof value.text !== 'string') {
		return { success: false, message: 'Enter a suggestion.' };
	}

	const text = value.text
		.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
		.trim();
	if (text.length < 10) {
		return { success: false, message: 'Suggestions must be at least 10 characters.' };
	}
	if (text.length > MAX_SUGGESTION_LENGTH) {
		return {
			success: false,
			message: `Suggestions must be ${MAX_SUGGESTION_LENGTH} characters or fewer.`,
		};
	}

	let displayName = '';
	if ('displayName' in value && value.displayName !== undefined && value.displayName !== null) {
		if (typeof value.displayName !== 'string') {
			return { success: false, message: 'Enter a valid display name.' };
		}
		displayName = value.displayName
			.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
			.trim();
		if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
			return {
				success: false,
				message: `Display names must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`,
			};
		}
	}

	return { success: true, value: { text, displayName } };
}

export type JsonBodyResult =
	| { success: true; value: unknown }
	| { success: false; status: 400 | 413; message: string };

export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
	const contentLength = Number(request.headers.get('content-length'));
	if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
		return { success: false, status: 413, message: 'The request is too large.' };
	}

	if (!request.body) {
		return { success: false, status: 400, message: 'Submit a valid JSON request.' };
	}

	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let totalBytes = 0;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		totalBytes += value.byteLength;
		if (totalBytes > MAX_REQUEST_BYTES) {
			await reader.cancel();
			return { success: false, status: 413, message: 'The request is too large.' };
		}
		chunks.push(value);
	}

	const bytes = new Uint8Array(totalBytes);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}

	try {
		const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
		return { success: true, value };
	} catch (error) {
		if (error instanceof SyntaxError) {
			return { success: false, status: 400, message: 'Submit a valid JSON request.' };
		}
		throw error;
	}
}
