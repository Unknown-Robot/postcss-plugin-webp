import { PluginCreator, Root, Rule, Declaration, Plugin, DeclarationProps } from "postcss";

/**
 * The interface of plugin options
 *
 * @export
 * @interface IPluginOptions
 */
export interface IPluginOptions {
    /**
     * The predicate CSS declaration needs to be transformed function
     * 
     * @param {Declaration} declaration - The CSS declaration to predicate
     * @return {boolean}
     */
    predicate?: (declaration: Declaration) => boolean;
    /**
     * The rename CSS declaration value function
     * 
     * @param {Declaration} declaration - The CSS declaration to rename
     * @return {string}
     */
    rename?: (declaration: Declaration) => string;
    /**
     * The class name for browsers not supporting WebP images.
     * 
     * @default "no-webp"
     * @type {string}
     */
    noWebpClass?: string;
    /**
     * The class name for browsers supporting WebP images.
     * 
     * @default "webp"
     * @type {string}
     */
    webpClass?: string;
    /**
     * The class name for browsers not supporting Javascript.
     * 
     * @default "no-js"
     * @type {string}
     */
    noJsClass?: string;
    /**
     * Add selector for browsers not supporting Javascript.
     * 
     * @default false
     * @type {boolean}
     */
    addNoJs?: boolean;
    /**
     * Add CSS modules support with :global().
     * 
     * @default false
     * @type {boolean}
     */
    modules?: boolean;
}

/**
 * The PostCSS plugin for transforming CSS rules to use WebP images
 *
 * @todo Update multiple declarations without duplicating WebP images
 * @param {IPluginOptions} [options={}] The plugin options
 * @return {Plugin}
 */
const plugin: PluginCreator<IPluginOptions> = (options: IPluginOptions = {}): Plugin  => {
    const {
        predicate = (declaration: Declaration) => (
            /\.(jpe?g|png|gif|avif)/i.test(declaration.value)
        ),
        rename = (declaration: Declaration) => (
            declaration.value.replace(/\.(jpe?g|png|gif|avif)/gi, ".webp")
               .replace(/image\/(jpeg|png|gif|avif)/gi, "image/webp")
        ),
        noWebpClass = "no-webp",
        noJsClass = "no-js",
        webpClass = "webp",
        addNoJs = false,
        modules = false
    }: IPluginOptions = options;

    /**
     * Add WebP classes in rule selectors
     *
     * @param {string[]} selectors The list of rule selectors
     * @param {string} className The WebP class name
     * @return {string[]}
     */
    const transformSelectors = (selectors: string[], className: string): string[] => {
        className = (modules)? `:global(.${className})`: `.${className}`;

        return selectors.map((selector) => {
            selector = selector.replace(className, "").replace(":root", "");
            if(selector.includes("html")) {
                return selector.replace("html", `html${className}`);
            }
            else if(selector.length) {
                return `html${className} ${selector}`;
            }

            return `html${className}`;
        });
    }

    /* The list of rules for browsers not supporting WebP */
    const noWebpRules = new Map<Rule, Rule>();
    /* The list of rules for browsers supporting WebP */
    const webpRules = new Map<Rule, Rule>();
    
    return {
        postcssPlugin: "postcss-plugin-webp",
        Rule: (rule: Rule) => {
            /* Skip CSS rule if the selector already has WebP class */
            if(rule.selector.includes(`.${noWebpClass}`)) {
                return;
            }

            /* The list of declarations for browsers not supporting WebP */
            const noWebpDeclarations: DeclarationProps[] = [];
            /* The list of declarations for browsers supporting WebP */
            const webpDeclarations: DeclarationProps[] = [];

            rule.walkDecls((declaration: Declaration) => {
                /* Skip CSS rule declaration if the predicate is invalid */
                if(!predicate(declaration)) {
                    return;
                }

                /* Add declaration for browsers not supporting WebP */
                noWebpDeclarations.push({ prop: declaration.prop, value: declaration.value });
                /* Add declaration for browsers supporting WebP */
                webpDeclarations.push({ prop: declaration.prop, value: rename(declaration) });

                /* Remove the declaration of the original rule */
                declaration.remove();
            });

            if(noWebpDeclarations.length > 0) {
                /* Create new rule for browsers not supporting WebP */
                const noWebpRule = new Rule({
                    selectors: transformSelectors(rule.selectors, noWebpClass),
                    nodes: noWebpDeclarations
                });

                /* Add selector for browsers not supporting Javascript */
                if(addNoJs === true) {
                    noWebpRule.selectors = noWebpRule.selectors.concat(
                        transformSelectors(rule.selectors, noJsClass)
                    );
                }

                /* Add rule for browsers not supporting WebP */
                noWebpRules.set(rule, noWebpRule);
            }

            if(webpDeclarations.length > 0) {
                /* Create new rule for browsers supporting WebP */
                const webpRule = new Rule({
                    selectors: transformSelectors(rule.selectors, webpClass),
                    nodes: webpDeclarations
                });

                /* Add rule for browsers supporting WebP */
                webpRules.set(rule, webpRule);
            }
        },
        OnceExit: (root: Root) => {
            /* Insert the rule for browsers not supporting WebP */
            for(const [rule, noWebpRule] of noWebpRules) {
                rule.after(noWebpRule);
            }

            /* Insert the rule for browsers supporting WebP */
            for(const [rule, webpRule] of webpRules) {
                rule.after(webpRule);
            }
        }
    }
};

plugin.postcss = true;

export default plugin;