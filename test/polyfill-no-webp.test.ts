/**
 * @jest-environment jsdom
 */

import { describe, expect, test, beforeEach, afterEach } from "@jest/globals";
import path from "node:path";

describe("Test polyfill with browsers not supporting WebP images", () => {
    const originalImage = global.Image;
    let timeout: NodeJS.Timeout;

    beforeEach(() => {
        global.document.documentElement.className = "no-js";
        global.Image = class extends originalImage {
            constructor(width?: number, height: number = 0) {
                super(width, height);
                timeout = setTimeout(() => {
                    this.onerror!(new ErrorEvent("error"));
                }, 100);
            }
        };
    });

    test("Test add WebP class to <html> element", async() => {
        require(path.resolve("src/polyfill"));

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(document.documentElement.classList.contains("webp")).toBe(false);
        expect(document.documentElement.classList.contains("no-js")).toBe(false);
        expect(document.documentElement.classList.contains("no-webp")).toBe(true);
    });

    afterEach(() => {
        global.Image = originalImage;
        clearTimeout(timeout);
    });
});