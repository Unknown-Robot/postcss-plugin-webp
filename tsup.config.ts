import { defineConfig } from "tsup";

export default defineConfig([{
    entry: ["src/polyfill.ts"],
    minify: "terser",
    format: "cjs",
    dts: false
}, {
    entry: ["src/plugin.ts"],
    treeshake: "smallest",
    format: ["cjs", "esm"],
    dts: true
}]);