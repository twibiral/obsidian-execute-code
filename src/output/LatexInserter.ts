import { App, setIcon, TFile, Vault } from "obsidian";
import { Outputter } from "./Outputter";
import { settingsInstance } from "src/transforms/LatexTransformer";
import { FIGURE_FILENAME_EXTENSIONS, TEMP_FIGURE_NAME } from 'src/transforms/LatexFigureName';
import { generalizeFigureTitle } from 'src/transforms/LatexFigureName';
import * as r from "./RegExpUtilities";
import * as path from "path";

const LINK_ALIAS = /\|[^\]]*/;
const ANY_WIKILINK_EMBEDDING = r.concat(/!\[\[.*?/, FIGURE_FILENAME_EXTENSIONS, r.optional(LINK_ALIAS), /\]\]/);
const ANY_MARKDOWN_EMBEDDING = r.concat(/!\[.*?\]\(.*?/, FIGURE_FILENAME_EXTENSIONS, /\)/);
const ANY_FIGURE_EMBEDDING: RegExp = r.alternate(ANY_WIKILINK_EMBEDDING, ANY_MARKDOWN_EMBEDDING);

const SAFE_ANY: RegExp = /([^`]|`[^`]|``[^`])*?/; // Match any text, that does not cross the ``` boundary of code blocks
const EMPTY_LINES: RegExp = /[\s\n]*/;

interface FigureContext {
    app: App;
    figureName: string;
    link: () => string; // evaluates at button click, to let Obsidian index the file
    file: TFile;
}

/** Forces an image to reload by appending a cache-busting timestamp to its URL */
export function updateImage(image: HTMLImageElement) {
    const baseUrl = image.src.split('?')[0];
    image.src = `${baseUrl}?cache=${Date.now()}`;
}

/**
 * Adds an obsidian link and clickable insertion icons to the output.
 * @param figureName - The name of the figure file with extension that was saved
 * @param figurePath - The path where the figure was saved
 * @param outputter - The Outputter instance used to write content
 */
export async function writeFileLink(figureName: string, figurePath: string, outputter: Outputter): Promise<void> {
    await outputter.writeMarkdown(`Saved [[${figureName}]]`);

    const isTempFigure = TEMP_FIGURE_NAME.test(figureName);
    if (isTempFigure) return outputter.write('\n');

    const file: TFile | null = outputter.app.vault.getFileByPath(outputter.srcFile);
    if (!file) throw new Error(`File not found: ${outputter.srcFile}`);

    const link = () => createObsidianLink(outputter.app, figurePath, outputter.srcFile);
    const figure: FigureContext = { app: outputter.app, figureName: figureName, link: link, file: file };
    const buttonClass = 'insert-figure-icon';

    const insertAbove: HTMLAnchorElement = outputter.writeIcon('image-up', 'Click to embed file above codeblock.\nCtrl + Click to replace previous embedding.', buttonClass);
    insertAbove.addEventListener('click', (event: MouseEvent) => insertEmbedding('above', event.ctrlKey, figure));

    const insertBelow: HTMLAnchorElement = outputter.writeIcon('image-down', 'Click to embed file below codeblock.\nCtrl + Click to replace next embedding.', buttonClass);
    insertBelow.addEventListener('click', (event: MouseEvent) => insertEmbedding('below', event.ctrlKey, figure));

    const copyLink: HTMLAnchorElement = outputter.writeIcon('copy', 'Copy the markdown link.', buttonClass);
    copyLink.addEventListener('click', () => navigator.clipboard.writeText(link()));

    outputter.write('\n');
}

/** * Inserts an embedded link to the figure above or below the current code blocks. */
async function insertEmbedding(pastePosition: 'above' | 'below', doReplace: boolean, figure: FigureContext): Promise<boolean> {
    try {
        const vault = figure.app.vault;
        const content: string = await vault.read(figure.file);

        const identifierSrc: string = settingsInstance.latexFigureTitlePattern
            .replace(/\(\?<name>[^)]*\)/, generalizeFigureTitle(figure.figureName).source);
        const identifier: RegExp = r.parse(identifierSrc);
        if (!identifier) return;

        const codeBlocks: RegExpMatchArray[] = findMatchingCodeBlocks(content, /(la)?tex/, identifier, figure.link(), doReplace);
        if (codeBlocks.length === 0) return false;

        codeBlocks.forEach(async (block: RegExpExecArray) => {
            await insertAtCodeBlock(block, pastePosition, figure);
        });
        return true;
    } catch (error) {
        console.error('Error inserting embedding:', error);
        throw error;
    }
}

/** Locates LaTeX code blocks containing the specified figure identifier and their surrounding embeddings */
function findMatchingCodeBlocks(content: string, language: RegExp, identifier: RegExp, link: string, doReplace?: boolean): RegExpMatchArray[] {
    const alreadyLinked: RegExp = r.group(r.escape(link));
    const codeblock: RegExp = r.concat(
        /```(run-)?/, r.group(language), /[\s\n]/,
        SAFE_ANY, r.group(identifier), SAFE_ANY,
        /```/);

    const previous: RegExp = r.capture(r.concat(ANY_FIGURE_EMBEDDING, EMPTY_LINES), 'replacePrevious');
    const above: RegExp = r.capture(r.concat(alreadyLinked, EMPTY_LINES), 'alreadyAbove');

    const below: RegExp = r.capture(r.concat(EMPTY_LINES, alreadyLinked), 'alreadyBelow');
    const next: RegExp = r.capture(r.concat(EMPTY_LINES, ANY_FIGURE_EMBEDDING), 'replaceNext');

    const blocksWithEmbeds: RegExp = new RegExp(r.concat(
        (doReplace) ? r.optional(previous) : null,
        r.optional(above),
        r.capture(codeblock, 'codeblock'),
        r.optional(below),
        (doReplace) ? r.optional(next) : null,
    ), 'g');

    const matches: RegExpMatchArray[] = Array.from(content.matchAll(blocksWithEmbeds));
    console.debug(`Searching markdown for`, blocksWithEmbeds, `resulted in `, matches.length, `codeblock(s)`, matches.map(match => match.groups));
    return matches;
}

/** Updates markdown source file to insert or replace a figure embedding relative to a code block */
async function insertAtCodeBlock(block: RegExpExecArray, pastePosition: 'above' | 'below', figure: FigureContext): Promise<void> {
    const vault = figure.app.vault;
    const groups = block.groups;
    if (!groups || !groups.codeblock) return;

    const canReplace: Boolean = (pastePosition === 'above')
        ? groups.replacePrevious?.length > 0
        : groups.replaceNext?.length > 0;

    const isAlreadyEmbedded: boolean = (pastePosition === 'above')
        ? groups.alreadyAbove?.length > 0
        : groups.alreadyBelow?.length > 0;
    if (isAlreadyEmbedded && !canReplace) return;

    const newText: string = (pastePosition === 'above')
        ? figure.link() + '\n\n' + groups.codeblock
        : groups.codeblock + '\n\n' + figure.link();

    if (!canReplace) {
        await vault.process(figure.file, data => data.replace(groups.codeblock, newText));
        return;
    }

    const oldTexts: string[] = (pastePosition === 'above')
        ? [groups.replacePrevious, groups.alreadyAbove, groups.codeblock]
        : [groups.codeblock, groups.alreadyBelow, groups.replaceNext];
    const oldCombined = oldTexts.filter(Boolean).join('');
    await vault.process(figure.file, data => data.replace(oldCombined, newText));
}

/** Let Obsidian generate a link adhering to preferences */
export function createObsidianLink(app: App, filePath: string, sourcePath: string, subpath?: string, alias?: string): string {
    const relative = getPathRelativeToVault(filePath);
    try {
        const file: TFile | null = app.vault.getFileByPath(relative);
        return app.fileManager.generateMarkdownLink(file, sourcePath, subpath, alias);
    } catch (error) {
        console.error(`File not found: ${relative}`);
        return '![[' + path.basename(filePath) + ']]';
    }

}

function getPathRelativeToVault(absolutePath: string) {
    const vaultPath = (this.app.vault.adapter as any).basePath;
    absolutePath = path.normalize(absolutePath);

    if (!absolutePath.startsWith(vaultPath)) return absolutePath;
    return absolutePath.slice(vaultPath.length)
        .replace(/^[\\\/]/, '')
        .replace(/\\/g, '/')
        .replace(/['"`]/, '')
        .trim();
}