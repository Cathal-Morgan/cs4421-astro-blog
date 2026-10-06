import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
export default defineConfig({
output: 'server', // Enables on-demand server rendering
adapter: node({
mode: 'standalone', // Self-contained HTTP server listening on a port
}),
});
