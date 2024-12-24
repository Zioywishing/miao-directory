import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
// import { viteSingleFile } from 'vite-plugin-singlefile'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        vue(),
        visualizer()
        // viteSingleFile()
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    server: {
        proxy: {
            '^/(get|upload|delete|query|rename|cut|mkdir)': {
                target: 'http://127.0.0.1:17705',
                changeOrigin: true,
                rewrite: (path) => path
            }
        }
    },
    build: {
        rollupOptions: {
            input: {
                main: 'index.html'
            },
            output: {
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/chunk-[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]',
                manualChunks(id) {
                    if (id.includes('export.ts') && id.includes('plugins')) {
                        return 'pluginExports'
                    }
                }
            }
        }
    }
})
