import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        host: true,
        port: 5173,
        strictPort: true,
        allowedHosts: ['.local', 'localhost', '127.0.0.1'],
    },
    build: { target: 'es2020' },
});
