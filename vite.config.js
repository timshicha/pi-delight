import { defineConfig } from 'vite';
import dns from 'node:dns';
import dotnet from 'dotenv';

dotnet.config();
dns.setDefaultResultOrder('verbatim');

export default defineConfig({
    server: {
        host: process.env.VITE_DEV_CLIENT_HOST,
        port: process.env.VITE_DEV_CLIENT_PORT,
        proxy: {
            '/ws': {
                target: `ws://${process.env.VITE_DEV_CLIENT_HOST}:${process.env.VITE_DEV_CLIENT_PORT}`,
                ws: true,
                changeOrigin: true,
            },
        },
    },
    root: './frontend',
});