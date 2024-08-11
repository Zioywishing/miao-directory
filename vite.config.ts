import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { viteSingleFile } from "vite-plugin-singlefile"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue(), viteSingleFile()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "src")
		}
	},
	server: {
		proxy: {
			"/get": {
				target: "http://127.0.0.1:17705",
				changeOrigin: true,
				rewrite: path => path.replace(/^\/get/, "/get")
			}, 
			
			"/upload": {
				target: "http://127.0.0.1:17705",
				changeOrigin: true,
				rewrite: path => path.replace(/^\/upload/, "/upload")
			}
		}
	},
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html")
			},
			output: {
				// 配置输出为单文件
				inlineDynamicImports: true,
				manualChunks: undefined,
				entryFileNames: "bundle.js",
				format: "iife", // 立即执行函数格式
				name: "MyBundle"
			}
		}
	}
});
