import { describe, expect, it } from 'vitest';
import { readJsonBody, validateSuggestion } from './suggestions';

describe('validateSuggestion', () => {
	it('trims valid text and display names', () => {
		expect(validateSuggestion({ text: '  A thoughtful suggestion  ', displayName: '  Alex ' })).toEqual({
			success: true,
			value: { text: 'A thoughtful suggestion', displayName: 'Alex' },
		});
	});

	it('rejects suggestions that are too short or too long', () => {
		expect(validateSuggestion({ text: 'short' }).success).toBe(false);
		expect(validateSuggestion({ text: 'x'.repeat(1201) }).success).toBe(false);
	});

	it('rejects non-string fields and oversized display names', () => {
		expect(validateSuggestion({ text: 42 }).success).toBe(false);
		expect(validateSuggestion({ text: 'A valid suggestion', displayName: 'x'.repeat(61) }).success).toBe(
			false,
		);
	});
});

describe('readJsonBody', () => {
	it('parses valid JSON', async () => {
		const request = new Request('https://example.test/api/suggestions', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ text: 'A thoughtful suggestion' }),
		});
		await expect(readJsonBody(request)).resolves.toEqual({
			success: true,
			value: { text: 'A thoughtful suggestion' },
		});
	});

	it('rejects oversized and malformed JSON bodies', async () => {
		const tooLarge = new Request('https://example.test/api/suggestions', {
			method: 'POST',
			headers: { 'content-length': '9000' },
			body: '{}',
		});
		const malformed = new Request('https://example.test/api/suggestions', {
			method: 'POST',
			body: '{',
		});

		await expect(readJsonBody(tooLarge)).resolves.toMatchObject({ success: false, status: 413 });
		await expect(readJsonBody(malformed)).resolves.toMatchObject({ success: false, status: 400 });
	});
});
