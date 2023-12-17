import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import autoprefixer from "autoprefixer";
import path from "path";
import process from "process";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	css: {
		postcss: {
			plugins: [
				autoprefixer({})
			]
		}	
	},
	resolve: {
		alias: {
			"@": path.resolve(process.cwd(), "./src"),
			"@server": path.resolve(process.cwd(), "../server/src"),
		}
	}
});
