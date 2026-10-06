import { spawn } from 'node:child_process';

const url = 'https://d127tr8alg8p0n.cloudfront.net';
const commands = {
	win32: ['explorer.exe', [url]],
	darwin: ['open', [url]],
	linux: ['xdg-open', [url]],
};

const [command, args] = commands[process.platform] ?? [];

if (!command) {
	throw new Error(`Opening the CloudFront site is not supported on ${process.platform}.`);
}

const browser = spawn(command, args, { detached: true, stdio: 'ignore' });
browser.on('error', (error) => {
	console.error(`Failed to open ${url}: ${error.message}`);
	process.exitCode = 1;
});
browser.unref();
