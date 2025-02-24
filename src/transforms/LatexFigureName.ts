import * as path from 'path';
import * as r from 'src/output/RegExpUtilities';
import { ExecutorSettings } from 'src/settings/Settings';

export const ILLEGAL_FILENAME_CHARS: RegExp = /[<>:"/\\|?*]+/g;
export const WHITESPACE_AND_ILLEGAL_CHARS: RegExp = /[<>:"/\\|?*\s]+/;
export const MAYBE_WHITESPACE_AND_ILLEGAL: RegExp = /[<>:"/\\|?*\s]*/;
export const FIGURE_FILENAME_EXTENSIONS: RegExp = /(.pdf|.svg|.png)/;
export const FILENAME_PREFIX: RegExp = /figure /;
export const UNNAMED_PREFIX: RegExp = /temp /;
export const TEMP_FIGURE_NAME: RegExp = /figure temp \d+/;

let latexFilenameIndex = 0;

export async function retrieveFigurePath(codeblockContent: string, titlePattern: string, srcFile: string, settings: ExecutorSettings): Promise<string> {
    const vaultAbsolutePath = (this.app.vault.adapter as any).basePath;
    const vaultAttachmentPath = await this.app.fileManager.getAvailablePathForAttachment("test", srcFile);
    const vaultAttachmentDir = path.dirname(vaultAttachmentPath);
    const figureDir = path.join(vaultAbsolutePath, vaultAttachmentDir);
    let figureTitle = captureFigureTitle(codeblockContent, titlePattern);
    if (!figureTitle) {
        const index = nextLatexFilenameIndex(settings.latexMaxFigures);
        figureTitle = UNNAMED_PREFIX.source + index;
    }
    return path.join(figureDir, FILENAME_PREFIX.source + figureTitle);
}

function captureFigureTitle(codeblockContent: string, titlePattern: string): string | undefined {
    const pattern = r.parse(titlePattern);
    if (!pattern) return undefined;
    const match = codeblockContent.match(pattern);
    const title = match?.[1];
    if (!title) return undefined;
    return sanitizeFilename(title);
}

function sanitizeFilename(input: string): string {
    const trailingFilenames: RegExp = r.concat(FIGURE_FILENAME_EXTENSIONS, /$/);
    return input
        .replace(ILLEGAL_FILENAME_CHARS, ' ') // Remove illegal filename characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
        .replace(r.concat(/^/, FILENAME_PREFIX), '') // Remove prefix
        .replace(trailingFilenames, ''); // Remove file extension
}

export function generalizeFigureTitle(figureName: string): RegExp {
    const normalized: string = sanitizeFilename(figureName);
    const escaped: RegExp = r.escape(normalized);
    const whitespaced = new RegExp(escaped.source
        .replace(/\s+/g, WHITESPACE_AND_ILLEGAL_CHARS.source)); // Also allow illegal filename characters in whitespace
    return r.concat(
        MAYBE_WHITESPACE_AND_ILLEGAL,
        r.optional(FILENAME_PREFIX), // Optional prefix
        MAYBE_WHITESPACE_AND_ILLEGAL,
        whitespaced,
        MAYBE_WHITESPACE_AND_ILLEGAL,
        r.optional(FIGURE_FILENAME_EXTENSIONS), // Optional file extension
        MAYBE_WHITESPACE_AND_ILLEGAL);
}

function nextLatexFilenameIndex(maxIndex: number): number {
    latexFilenameIndex %= maxIndex;
    return latexFilenameIndex++;
}
