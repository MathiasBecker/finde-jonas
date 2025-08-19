import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

const buildDate = new Date();
const formattedDate = new Intl.DateTimeFormat('de-DE', {
	dateStyle: 'full',
	timeStyle: 'long',
	timeZone: 'Europe/Berlin',
}).format(buildDate).toString();

// https://vitejs.dev/config/
export default defineConfig({
	// plugins: [preact({ prerender: { enabled: true, renderTarget: 'body' } })],
	plugins: [preact()],
	css: {
		transformer: 'lightningcss',
	},
	define: {
		__VERSION__: { date: formattedDate },
	},
	build: {
		cssMinify: 'lightningcss',
		sourcemap: 'hidden',
	},
	esbuild: { legalComments: 'none' },
});
