import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
// import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        vue()
        // viteSingleFile()
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    server: {
        proxy: {
            '/get': {
                target: 'http://127.0.0.1:17705',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/get/, '/get')
            },

            '/upload': {
                target: 'http://127.0.0.1:17705',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/upload/, '/upload')
            },

            '/delete': {
                target: 'http://127.0.0.1:17705',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/delete/, '/delete')
            },
            '/query': {
                target: 'http://127.0.0.1:17705',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/query/, '/query')
            },
            '/rename': {
                target: 'http://127.0.0.1:17705',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/rename/, '/rename')
            },
            '/cut': {
                target: 'http://127.0.0.1:17705',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/cut/, '/cut')
            },
            '/mkdir': {
                target: 'http://127.0.0.1:17705',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/mkdir/, '/mkdir')
            }
        }
    },
    build: {
        rollupOptions: {
            input: {
                main: 'index.html'
            },
            // output: {
            //     entryFileNames: (chunkInfo) => {
            //         if (chunkInfo.name === 'main') {
            //             return 'main.js'
            //         }
            //         return '[name].[hash].js'
            //     }
            // }
        }
    }
})
