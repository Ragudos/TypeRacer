import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

/** @type {import("rollup").RollupOptions} */
export default {
    input: "src/index.mjs",
    output: {
        file: "dist/index.cjs",
        format: "cjs",
        minifyInternalExports: true,
    },
    plugins: [json(),nodeResolve(), commonjs()]
}
