// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders, logHandlers } from 'astro/config';
import node from '@astrojs/node';

const output = process.env.ASTRO_OUTPUT === 'static' ? 'static' : 'server';

// https://astro.build/config
export default defineConfig({
	site: process.env.ASTRO_SITE_URL ?? 'https://d127tr8alg8p0n.cloudfront.net',
	output,
	integrations: [mdx(), sitemap()],
	logger: logHandlers.json(),
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
	...(output === 'server' && {
		adapter: node({
			mode: 'standalone',
		}),
	}),
});