// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
<<<<<<< Updated upstream
import { defineConfig, fontProviders } from 'astro/config';
=======
import { defineConfig, fontProviders, logHandlers } from 'astro/config';
>>>>>>> Stashed changes

// https://astro.build/config
export default defineConfig({
	site: 'https://example.com',
	integrations: [mdx(), sitemap()],
<<<<<<< Updated upstream
=======
	logger: logHandlers.json(),
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
});
=======
});
>>>>>>> Stashed changes
