import { defineConfig } from 'vite';

const additionalAllowedHosts = (process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);

export default defineConfig({
    server: {
        host: true,
        port: 5173,
        strictPort: true,
        allowedHosts: ['mini.local', '.local', 'localhost', '127.0.0.1', ...additionalAllowedHosts],
    },
    build: { target: 'es2020' },
});
