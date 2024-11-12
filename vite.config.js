import { defineConfig} from 'vite';
import dns from 'node:dns';

dns.setDefaultResultOrder('verbatim');

export default defineConfig({
    server: {
        port: 3000,
    },
    root: './frontend'
});