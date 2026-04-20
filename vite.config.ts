import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        host: true,
        port: 5173,
        strictPort: true,
        allowedHosts: ['mini.local', 'localhost', '127.0.0.1'],
        proxy: {
            '/api': {
                target: process.env.VITE_BACKEND_URL || 'http://mini.local:3000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: { target: 'es2020' },
});
