import { describe, expect, test } from "@jest/globals";
import postcss from "postcss";

import plugin, { IPluginOptions } from "../src/plugin";

/**
 * Check if transformed input is equal to expected output
 *
 * @param {string} input The CSS rules input
 * @param {string} output The CSS rules output expected
 * @param {IPluginOptions} [options={}] The plugin options
 * @return {Promise<void>}
 */
const process = async(input: string, output: string, options: IPluginOptions = {}): Promise<void> => {
    const result = await postcss(plugin(options)).process(input, { from: undefined, to: undefined });

    return expect(result.css).toEqual(output);
}

describe("Test PostCSS plugin", () => {
    describe("Testing plugin options", () => {
        test("Test plugin without options", () => {
            expect(plugin()).toBeDefined();
        });

        test("Test use custom WebP classes", async() => {
            await process(`html section { background-image: url(./image.png); color: red; }`, [
                `html section { color: red; }`,
                `html.custom-webp section { background-image: url(./image.webp); }`,
                `html.custom-no-webp section { background-image: url(./image.png); }`
            ].join("\n"), { webpClass: "custom-webp", noWebpClass: "custom-no-webp" });
        });

        test("Test use custom no Javascript classes", async() => {
            await process(`html section { background-image: url(./image.png); color: red; }`, [
                `html section { color: red; }`,
                `html.webp section { background-image: url(./image.webp); }`,
                `html.no-webp section, html.no-javascript section { background-image: url(./image.png); }`
            ].join("\n"), { addNoJs: true, noJsClass: "no-javascript" });
        });

        test("Test use WebP classes with CSS modules", async() => {
            await process(`html section { background-image: url(./image.png); color: red; }`, [
                `html section { color: red; }`,
                `html:global(.webp) section { background-image: url(./image.webp); }`,
                `html:global(.no-webp) section { background-image: url(./image.png); }`
            ].join("\n"), { modules: true });
        });

        test("Test use no Javascript classes with CSS modules", async() => {
            await process(`html section { background-image: url(./image.png); color: red; }`, [
                `html section { color: red; }`,
                `html:global(.webp) section { background-image: url(./image.webp); }`,
                `html:global(.no-webp) section, html:global(.no-js) section { background-image: url(./image.png); }`
            ].join("\n"), { addNoJs: true, modules: true });
        });

        test("Test use custom rename WebP classes", async() => {
            await process(`html section { background-image: url(./image.png); color: red; }`, [
                `html section { color: red; }`,
                `html.webp section { background-image: url(./image.custom.webp); }`,
                `html.no-webp section { background-image: url(./image.png); }`
            ].join("\n"), { rename: (declaration) => (
                declaration.value.replace(/\.(jpe?g|png|gif|avif)/gi, ".custom.webp")
            )});
        });

        test("Test use custom predicate WebP function", async() => {
            await process(`html section { background-image: url(./image.png); border-image: url(./image.jpg); }`, [
                `html section { border-image: url(./image.jpg); }`,
                `html.webp section { background-image: url(./image.webp); }`,
                `html.no-webp section { background-image: url(./image.png); }`
            ].join("\n"), { predicate: (declaration) => (
                declaration.prop === "background-image"
            )});
        });
    });

    describe("Test input that should not make transformations", () => {
        test("Test CSS rule with empty declaration", async() => {
            await process(`section { }`, `section { }`);
        });

        test("Test CSS rule without image declaration", async() => {
            await process(`section { position: relative }`, `section { position: relative }`);
        });

        test("Test CSS rule with already WebP image declaration", async() => {
            await process(`section { background: url(./image.webp); }`, `section { background: url(./image.webp); }`);
        });

        test("Test CSS rule with already WebP classes", async() => {
            await process(`html.webp section { background: url(./image.webp); } html.no-webp section { background: url(./image.png); }`, [
                `html.webp section { background: url(./image.webp); }`,
                `html.no-webp section { background: url(./image.png); }`
            ].join(" "));
        });

        test("Test CSS rule with already custom WebP classes", async() => {
            await process(`section.custom-webp { background: url(./image.webp); } section.custom-no-webp { background: url(./image.png); }`, [
                `section.custom-webp { background: url(./image.webp); }`,
                `section.custom-no-webp { background: url(./image.png); }`
            ].join(" "), { webpClass: "custom-webp", noWebpClass: "custom-no-webp" });
        });
    });

    describe("Test add WebP classes to HTML element", () => {
        test("Test add WebP classes without duplicate HTML element", async() => {
            await process(`html main { background-image: url(./image.png); color: red; }`, [
                `html main { color: red; }`,
                `html.webp main { background-image: url(./image.webp); }`,
                `html.no-webp main { background-image: url(./image.png); }`
            ].join("\n"));
        });

        test("Test add WebP classes to HTML element attributes selector", async() => {
            await process(`html[data-ready='true'] main { background: url(./image.jpg); color: red; }`, [
                `html[data-ready='true'] main { color: red; }`,
                `html.webp[data-ready='true'] main { background: url(./image.webp); }`,
                `html.no-webp[data-ready='true'] main { background: url(./image.jpg); }`
            ].join("\n"));
        });

        test("Test add WebP classes to HTML element pseudo classes selector", async() => {
            await process(`html:not(.ready) main { background: url(./image.jpg); color: red; }`, [
                `html:not(.ready) main { color: red; }`,
                `html.webp:not(.ready) main { background: url(./image.webp); }`,
                `html.no-webp:not(.ready) main { background: url(./image.jpg); }`
            ].join("\n"));
        });
    });

    describe("Test add WebP classes to all declarations", () => {
        test("Test add WebP classes to background declaration", async() => {
            await process(`section { background: url("./image.png"); color: red; }`, [
                `section { color: red; }`,
                `html.webp section { background: url("./image.webp"); }`,
                `html.no-webp section { background: url("./image.png"); }`
            ].join("\n"));
        });

        test("Test add WebP classes to border-image declaration", async() => {
            await process(`section { border-image: url("./image.png"); color: red; }`, [
                `section { color: red; }`,
                `html.webp section { border-image: url("./image.webp"); }`,
                `html.no-webp section { border-image: url("./image.png"); }`
            ].join("\n"));
        });

        test("Test add WebP classes to background-image declaration", async() => {
            await process(`section { background-image: url("./image().png"); color: red; }`, [
                `section { color: red; }`,
                `html.webp section { background-image: url("./image().webp"); }`,
                `html.no-webp section { background-image: url("./image().png"); }`
            ].join("\n"));
        });

        test("Test add WebP classes to image-set declaration", async() => {
            await process(`section { background: image-set(url("image.jpg") 1x, url("image.jpg") 2x); color: red; }`, [
                `section { color: red; }`,
                `html.webp section { background: image-set(url("image.webp") 1x, url("image.webp") 2x); }`,
                `html.no-webp section { background: image-set(url("image.jpg") 1x, url("image.jpg") 2x); }`
            ].join("\n"));
        });

        test("Test add WebP classes to complex background declaration", async() => {
            await process(`section { background: url("./image(png).png") 50% 50% / cover #FFF no-repeat; color: red; }`, [
                `section { color: red; }`,
                `html.webp section { background: url("./image(png).webp") 50% 50% / cover #FFF no-repeat; }`,
                `html.no-webp section { background: url("./image(png).png") 50% 50% / cover #FFF no-repeat; }`
            ].join("\n"));
        });

        test("Test add WebP classes to complex border-image declaration", async() => {
            await process(`section { border-image: url("./image.png") 30 fill / 30px / 30px space; color: red; }`, [
                `section { color: red; }`,
                `html.webp section { border-image: url("./image.webp") 30 fill / 30px / 30px space; }`,
                `html.no-webp section { border-image: url("./image.png") 30 fill / 30px / 30px space; }`
            ].join("\n"));
        });

        test("Test add WebP classes to complex background-image declaration", async() => {
            await process(`section { background-image: linear-gradient(rgba(0, 0, 255, 0.5), rgba(255, 255, 0, 0.5)), url("../../media/image.png"); color: red; }`, [
                `section { color: red; }`,
                `html.webp section { background-image: linear-gradient(rgba(0, 0, 255, 0.5), rgba(255, 255, 0, 0.5)), url("../../media/image.webp"); }`,
                `html.no-webp section { background-image: linear-gradient(rgba(0, 0, 255, 0.5), rgba(255, 255, 0, 0.5)), url("../../media/image.png"); }`
            ].join("\n"));
        });

        test("Test add WebP classes to complex image-set declaration", async() => {
            await process(`section { background: image-set(url("image.jpg") type("image/jpeg"), "image.png" type("image/png")) 50% 50% / cover #FFF no-repeat; color: red; }`, [
                `section { color: red; }`,
                `html.webp section { background: image-set(url("image.webp") type("image/webp"), "image.webp" type("image/webp")) 50% 50% / cover #FFF no-repeat; }`,
                `html.no-webp section { background: image-set(url("image.jpg") type("image/jpeg"), "image.png" type("image/png")) 50% 50% / cover #FFF no-repeat; }`
            ].join("\n"));
        });

        test("Test add WebP classes to multiple background URL's in declaration", async() => {
            await process(`section { background: url(./image.jpg), url(./image.png); color: red; }`, [
                `section { color: red; }`,
                `html.webp section { background: url(./image.webp), url(./image.webp); }`,
                `html.no-webp section { background: url(./image.jpg), url(./image.png); }`
            ].join("\n"));
        });

        test("Test add WebP classes to multiple background-image URL's in declaration", async() => {
            await process(`section { background-image: url(./image.jpg), url(./image.png); color: red; }`, [
                `section { color: red; }`,
                `html.webp section { background-image: url(./image.webp), url(./image.webp); }`,
                `html.no-webp section { background-image: url(./image.jpg), url(./image.png); }`
            ].join("\n"));
        });

        test("Test add WebP classes to multiple cursor URL's in declaration", async() => {
            await process(`section { cursor: url(./image.gif), url(./cursor.cur), auto; color: red; }`, [
                `section { color: red; }`,
                `html.webp section { cursor: url(./image.webp), url(./cursor.cur), auto; }`,
                `html.no-webp section { cursor: url(./image.gif), url(./cursor.cur), auto; }`
            ].join("\n"));
        });

        test("Test add WebP classes to multiple background image declarations", async() => {
            await process(`section { background: url(./image.jpg); color: red; background-image: url(./image.jpeg); border-image: url(./image.png); }`, [
                `section { color: red; }`,
                `html.webp section { background: url(./image.webp); background-image: url(./image.webp); border-image: url(./image.webp); }`,
                `html.no-webp section { background: url(./image.jpg); background-image: url(./image.jpeg); border-image: url(./image.png); }`
            ].join("\n"));
        });

        test("Test add WebP classes to background image fallback declaration", async() => {
            await process(`section { background-image: url("image.gif"); background-image: image-set(url("image.png"), url("image.jpg")); color: red; }`, [
                `section { color: red; }`,
                `html.webp section { background-image: url("image.webp"); background-image: image-set(url("image.webp"), url("image.webp")); }`,
                `html.no-webp section { background-image: url("image.gif"); background-image: image-set(url("image.png"), url("image.jpg")); }`
            ].join("\n"));
        });
    });

    describe("Test add WebP classes to HTML tag", () => {
        test("Test add WebP classes to HTML tag selector", async() => {
            await process(`section { background: url(./image.jpg); color: red; }`, [
                `section { color: red; }`,
                `html.webp section { background: url(./image.webp); }`,
                `html.no-webp section { background: url(./image.jpg); }`
            ].join("\n"));
        });
    
        test("Test add WebP classes to nested HTML tag selector", async() => {
            await process(`main section { background: url(./image.jpg); color: red; }`, [
                `main section { color: red; }`,
                `html.webp main section { background: url(./image.webp); }`,
                `html.no-webp main section { background: url(./image.jpg); }`
            ].join("\n"));
        });

        test("Test add WebP classes to multiple HTML tag selectors", async() => {
            await process(`main, section { background: url(./image.jpg); color: red; }`, [
                `main, section { color: red; }`,
                `html.webp main, html.webp section { background: url(./image.webp); }`,
                `html.no-webp main, html.no-webp section { background: url(./image.jpg); }`
            ].join("\n"));
        });
    
        test("Test add WebP classes to child combinator HTML tag selector", async() => {
            await process(`main > section { background: url(./image.jpg); color: red; }`, [
                `main > section { color: red; }`,
                `html.webp main > section { background: url(./image.webp); }`,
                `html.no-webp main > section { background: url(./image.jpg); }`
            ].join("\n"));
        });
    });

    describe("Test add WebP classes to HTML class", () => {
        test("Test add WebP classes to HTML class selector", async() => {
            await process(`.test { background: url(./image.jpg); color: red; }`, [
                `.test { color: red; }`,
                `html.webp .test { background: url(./image.webp); }`,
                `html.no-webp .test { background: url(./image.jpg); }`
            ].join("\n"));
        });

        test("Test add WebP classes to nested HTML class selector", async() => {
            await process(`.test1 .test2 { background: url(./image.jpg); color: red; }`, [
                `.test1 .test2 { color: red; }`,
                `html.webp .test1 .test2 { background: url(./image.webp); }`,
                `html.no-webp .test1 .test2 { background: url(./image.jpg); }`
            ].join("\n"));
        });

        test("Test add WebP classes to multiple HTML class selectors", async() => {
            await process(`.test1, .test2 { background: url(./image.jpg); color: red; }`, [
                `.test1, .test2 { color: red; }`,
                `html.webp .test1, html.webp .test2 { background: url(./image.webp); }`,
                `html.no-webp .test1, html.no-webp .test2 { background: url(./image.jpg); }`
            ].join("\n"));
        });
    
        test("Test add WebP classes to child combinator HTML class selector", async() => {
            await process(`.test1 > .test2 { background: url(./image.jpg); color: red; }`, [
                `.test1 > .test2 { color: red; }`,
                `html.webp .test1 > .test2 { background: url(./image.webp); }`,
                `html.no-webp .test1 > .test2 { background: url(./image.jpg); }`
            ].join("\n"));
        });
    });

    describe("Test add WebP classes to HTML identifier", () => {
        test("Test add WebP classes to HTML identifier selector", async() => {
            await process(`#test { background: url(./image.jpg); color: red; }`, [
                `#test { color: red; }`,
                `html.webp #test { background: url(./image.webp); }`,
                `html.no-webp #test { background: url(./image.jpg); }`
            ].join("\n"));
        });

        test("Test add WebP classes to nested HTML identifier selector", async() => {
            await process(`#test1 #test2 { background: url(./image.jpg); color: red; }`, [
                `#test1 #test2 { color: red; }`,
                `html.webp #test1 #test2 { background: url(./image.webp); }`,
                `html.no-webp #test1 #test2 { background: url(./image.jpg); }`
            ].join("\n"));
        });

        test("Test add WebP classes to multiple HTML identifier selectors", async() => {
            await process(`#test1, #test2 { background: url(./image.jpg); color: red; }`, [
                `#test1, #test2 { color: red; }`,
                `html.webp #test1, html.webp #test2 { background: url(./image.webp); }`,
                `html.no-webp #test1, html.no-webp #test2 { background: url(./image.jpg); }`
            ].join("\n"));
        });
    
        test("Test add WebP classes to child combinator HTML identifier selector", async() => {
            await process(`#test1 > #test2 { background: url(./image.jpg); color: red; }`, [
                `#test1 > #test2 { color: red; }`,
                `html.webp #test1 > #test2 { background: url(./image.webp); }`,
                `html.no-webp #test1 > #test2 { background: url(./image.jpg); }`
            ].join("\n"));
        });
    });

    describe("Test add WebP classes to CSS variables", () => {
        test("Test add WebP classes to CSS local variables", async() => {
            await process(`html main { --main-bg-image: url(./image.jpg); --main-color: red; } main section { background-image: var(--main-bg-image); color: var(--main-color); }`, [
                `html main { --main-color: red; }`,
                `html.webp main { --main-bg-image: url(./image.webp); }`,
                `html.no-webp main { --main-bg-image: url(./image.jpg); }`,
                `main section { background-image: var(--main-bg-image); color: var(--main-color); }`
            ].join(" "));
        });

        test("Test add WebP classes to CSS root variables", async() => {
            await process(`:root { --section-bg-image: url(./image.jpg); --section-color: red; } section { background-image: var(--section-bg-image); color: --var(section-color); }`, [
                `:root { --section-color: red; }`,
                `html.webp { --section-bg-image: url(./image.webp); }`,
                `html.no-webp { --section-bg-image: url(./image.jpg); }`,
                `section { background-image: var(--section-bg-image); color: --var(section-color); }`
            ].join(" "));
        });
    });

    describe("Test add WebP classes into CSS Media Queries", () => {
        test("Test add WebP classes to HTML tag selector in CSS Media Queries", async() => {
            await process(["@media screen {", "section { background: url(./image.jpg); color: red; }", "}"].join("\n"), [
                `@media screen {`,
                    `section { color: red; }`,
                    `html.webp section { background: url(./image.webp);`, "}",
                    `html.no-webp section { background: url(./image.jpg);`, "}",
                `}`
            ].join("\n"));
        });

        test("Test add WebP classes to HTML class selector in CSS Media Queries", async() => {
            await process(["@media screen {", ".test { background: url(./image.jpg); color: red; }", "}"].join("\n"), [
                `@media screen {`,
                    `.test { color: red; }`,
                    `html.webp .test { background: url(./image.webp);`, "}",
                    `html.no-webp .test { background: url(./image.jpg);`, "}",
                `}`
            ].join("\n"));
        });

        test("Test add WebP classes to multiple HTML class selector in CSS Media Queries", async() => {
            await process(["@media screen {", ".test1, .test2 { background: url(./image.jpg); color: red; }", "}"].join("\n"), [
                `@media screen {`,
                    `.test1, .test2 { color: red; }`,
                    `html.webp .test1, html.webp .test2 { background: url(./image.webp);`, "}",
                    `html.no-webp .test1, html.no-webp .test2 { background: url(./image.jpg);`, "}",
                `}`
            ].join("\n"));
        });
    });

    describe("Test add WebP classes into CSS Container", () => {
        test("Test add WebP classes to HTML tag selector in CSS Container", async() => {
            await process(["@container style(--responsive: true) {", "section { background: url(./image.jpg); color: red; }", "}"].join("\n"), [
                `@container style(--responsive: true) {`,
                    `section { color: red; }`,
                    `html.webp section { background: url(./image.webp);`, "}",
                    `html.no-webp section { background: url(./image.jpg);`, "}",
                `}`
            ].join("\n"));
        });

        test("Test add WebP classes to HTML class selector in CSS Container", async() => {
            await process(["@container style(--responsive: true) {", ".test { background: url(./image.jpg); color: red; }", "}"].join("\n"), [
                `@container style(--responsive: true) {`,
                    `.test { color: red; }`,
                    `html.webp .test { background: url(./image.webp);`, "}",
                    `html.no-webp .test { background: url(./image.jpg);`, "}",
                `}`
            ].join("\n"));
        });

        test("Test add WebP classes to multiple HTML class selector in CSS Container", async() => {
            await process(["@container style(--responsive: true) {", ".test1, .test2 { background: url(./image.jpg); color: red; }", "}"].join("\n"), [
                `@container style(--responsive: true) {`,
                    `.test1, .test2 { color: red; }`,
                    `html.webp .test1, html.webp .test2 { background: url(./image.webp);`, "}",
                    `html.no-webp .test1, html.no-webp .test2 { background: url(./image.jpg);`, "}",
                `}`
            ].join("\n"));
        });
    });
});