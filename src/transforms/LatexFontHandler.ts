import { Platform } from 'obsidian';
import * as path from 'path';
import { ExecutorSettings } from 'src/settings/Settings';

let validFonts = new Set<string>;
let invalidFonts = new Set<string>;

interface FontNames {
    main: string;
    sans: string;
    mono: string;
}

/** Generates LaTeX font configuration based on system or Obsidian fonts. */
export function addFontSpec(settings: ExecutorSettings): string {
    const isPdflatex = path.basename(settings.latexCompilerPath).toLowerCase().includes('pdflatex');
    if (isPdflatex || settings.latexAdaptFont === '') return '';

    const platformFonts = getPlatformFonts();
    const fontSpec = buildFontCommand(settings, platformFonts);
    if (!fontSpec) return '';

    const packageSrc = `\\usepackage{fontspec}\n`;
    return packageSrc + fontSpec;
}

/** Retrieves Obsidian's font settings from CSS variables. */
function getObsidianFonts(cssVariable: string): string {
    const cssDeclarations = getComputedStyle(document.body);
    const fonts = cssDeclarations.getPropertyValue(cssVariable).split(`'??'`)[0];
    return sanitizeCommaList(fonts);
}

/** Constructs LaTeX font commands based on the provided settings and platform-specific fonts. */
function buildFontCommand(settings: ExecutorSettings, fonts: FontNames): string {
    if (settings.latexAdaptFont === 'obsidian') {
        fonts.main = [getObsidianFonts('--font-text'), fonts.main].join(',');
        fonts.sans = [getObsidianFonts('--font-interface'), fonts.sans].join(',');
        fonts.mono = [getObsidianFonts('--font-monospace'), fonts.mono].join(',');
    }
    const mainSrc = buildSetfont('main', fonts.main);
    const sansSrc = buildSetfont('sans', fonts.sans);
    const monoSrc = buildSetfont('mono', fonts.mono);
    return mainSrc + sansSrc + monoSrc;
}

/** Returns default system fonts based on current platform */
function getPlatformFonts(): FontNames {
    if (Platform.isWin) return { main: 'Segoe UI', sans: 'Segoe UI', mono: 'Consolas' };
    if (Platform.isMacOS) return { main: 'SF Pro', sans: 'SF Pro', mono: 'SF Mono' };
    if (Platform.isLinux) return { main: 'DejaVu Sans', sans: 'DejaVu Sans', mono: 'DejaVu Sans Mono' };
    return { main: '', sans: '', mono: '' };
}

/** Generates LuaLaTeX setfont command for specified font type. */
function buildSetfont(type: 'main' | 'mono' | 'sans', fallbackList: string): string {
    const font = firstValidFont(fallbackList);
    return (font) ? `\\set${type}font{${font}}\n` : '';
}

function firstValidFont(fallbackList: string): string {
    return sanitizeCommaList(fallbackList)
        .split(', ')
        .reduce((result, font) => result || (cachedTestFont(font) ? font : undefined), undefined);
}

/** For performance, do not retest a font during the app's lifetime. */
function cachedTestFont(fontName: string): boolean {
    if (validFonts.has(fontName)) return true;
    if (invalidFonts.has(fontName)) return false;
    if (!testFont(fontName)) {
        invalidFonts.add(fontName);
        return false;
    }
    validFonts.add(fontName);
    return true;
}

/** Tests if a font is available by comparing text measurements on canvas. */
function testFont(fontName: string): boolean {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return false;

    const text = 'abcdefghijklmnopqrstuvwxyz';
    context.font = `16px monospace`;
    const baselineWidth = context.measureText(text).width;

    context.font = `16px "${fontName}", monospace`;
    const testWidth = context.measureText(text).width;

    const isFontAvailable = baselineWidth !== testWidth;
    console.debug((isFontAvailable) ? `Font ${fontName} accepted.` : `Font ${fontName} ignored.`);
    return isFontAvailable;
}

/** Cleans and normalizes comma-separated font family lists */
function sanitizeCommaList(commaList: string): string {
    return commaList
        .split(',')
        .map(font => font.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
        .join(', ');
}
