/*
 * Adds functions that parse source code for magic commands and transpile them to the target language.
 *
 * List of Magic Commands:
 * - `@show(ImagePath)`: Displays an image at the given path in the note.
 * - `@show(ImagePath, Width, Height)`: Displays an image at the given path in the note.
 * - `@show(ImagePath, Width, Height, Alignment)`: Displays an image at the given path in the note.
 * - `@vault`: Inserts the vault path as string.
 * - `@note`: Inserts the note path as string.
 * - `@title`: Inserts the note title as string.
 */

import * as os from "os";
import { TOGGLE_HTML_SIGIL } from "src/Outputter";

// Regex for all languages.
const SHOW_REGEX = /@show\(["'](?<path>[^<>?*=!\n#()\[\]{}]+)["'](,\s*(?<width>\d+[\w%]+),?\s*(?<height>\d+[\w%]+))?(,\s*(?<align>left|center|right))?\)/g;
const HTML_REGEX = /@html\((?<html>[^)]+)\)/g;
const VAULT_REGEX = /@vault/g
const CURRENT_NOTE_REGEX = /@note/g;
const NOTE_TITLE_REGEX = /@title/g;

// Regex that are only used by one language.
const PYTHON_PLOT_REGEX = /^(plt|matplotlib.pyplot|pyplot)\.show\(\)/gm;
const R_PLOT_REGEX = /^plot\(.*\)/gm;

/**
 * Parses the source code for the @vault command and replaces it with the vault path.
 *
 * @param source The source code to parse.
 * @param vaultPath The path of the vault.
 * @returns The transformed source code.
 */
export function insertVaultPath(source: string, vaultPath: string): string {
	return source.replace(VAULT_REGEX, `"app://local/${vaultPath.replace(/\\/g, "/")}"`);
}


/**
 * Parses the source code for the @note command and replaces it with the note path.
 *
 * @param source The source code to parse.
 * @param notePath The path of the vault.
 * @returns The transformed source code.
 */
export function insertNotePath(source: string, notePath: string): string {
	return source.replace(CURRENT_NOTE_REGEX, `"app://local/${notePath.replace(/\\/g, "/")}"`);
}


/**
 * Parses the source code for the @vault command and replaces it with the vault path.
 *
 * @param source The source code to parse.
 * @param noteTitle The path of the vault.
 * @returns The transformed source code.
 */
export function insertNoteTitle(source: string, noteTitle: string): string {
	let t = "";
	if (noteTitle.contains("."))
		t = noteTitle.split(".").slice(0, -1).join(".");

	return source.replace(NOTE_TITLE_REGEX, `"${t}"`);
}


/**
 * Add the @show command to python. @show is only supported in python and javascript.
 *
 * @param source The source code to parse.
 * @returns The transformed source code.
 */
export function addMagicToPython(source: string): string {
	source = pythonParseShowImage(source);
	source = pythonParseHtmlFunction(source);
	return source;
}


/**
 * Add the @show command to javascript. @show is only supported in python and javascript.
 *
 * @param source The source code to parse.
 * @returns The transformed source code.
 */
export function addMagicToJS(source: string): string {
	source = jsParseShowImage(source);
	source = jsParseHtmlFunction(source);
	return source;
}


/**
 * Parses some python code and changes it to display plots in the note instead of opening a new window.
 * Only supports normal plots generated with the `plt.show(...)` function.
 *
 * @param source The source code to parse.
 * @param toggleHtmlSigil The meta-command to allow and disallow HTML
 * @returns The transformed source code.
 */
export function addInlinePlotsToPython(source: string, toggleHtmlSigil: string): string {
	const showPlot = `import io; import sys; __obsidian_execute_code_temp_pyplot_var__=io.BytesIO(); plt.plot(); plt.savefig(__obsidian_execute_code_temp_pyplot_var__, format='svg'); plt.close(); sys.stdout.write(${JSON.stringify(toggleHtmlSigil)}); sys.stdout.flush(); sys.stdout.buffer.write(__obsidian_execute_code_temp_pyplot_var__.getvalue()); sys.stdout.flush(); sys.stdout.write(${JSON.stringify(toggleHtmlSigil)}); sys.stdout.flush()`;
	return source.replace(PYTHON_PLOT_REGEX, showPlot);
}


/**
 * Parses some R code and changes it to display plots in the note instead of opening a new window.
 * Only supports normal plots generated with the `plot(...)` function.
 *
 * @param source The source code to parse.
 * @returns The transformed source code.
 */
export function addInlinePlotsToR(source: string): string {
	const matches = source.matchAll(R_PLOT_REGEX);
	for (const match of matches) {
		const tempFile = `${os.tmpdir()}/temp_${Date.now()}.png`.replace(/\\/g, "/");
		const substitute = `png("${tempFile}"); ${match[0]}; dev.off(); cat('${TOGGLE_HTML_SIGIL}<img src="app://local/${tempFile}" align="center">${TOGGLE_HTML_SIGIL}')`;

		source = source.replace(match[0], substitute);
	}

	return source;
}


/**
 * Parses the PYTHON code for the @show command and replaces it with the image.
 * @param source The source code to parse.
 */
function pythonParseShowImage(source: string): string {
	const matches = source.matchAll(SHOW_REGEX);
	for (const match of matches) {
		const imagePath = match.groups.path;
		const width = match.groups.width;
		const height = match.groups.height;
		const alignment = match.groups.align;

		const image = buildMagicShowImage(imagePath.replace(/\\/g, "\\\\"), width, height, alignment);
		source = source.replace(match[0], "print(\'" + TOGGLE_HTML_SIGIL + image + TOGGLE_HTML_SIGIL + "\')");
	}

	return source;
}

/**
 * Parses the PYTHON code for the @html command and surrounds it with the toggle-escaoe token.
 * @param source 
 */
function pythonParseHtmlFunction(source: string): string {
	const matches = source.matchAll(HTML_REGEX);
	for(const match of matches) {
		const html = match.groups.html;
		
		const toggle = JSON.stringify(TOGGLE_HTML_SIGIL);
		
		source = source.replace(match[0], `print(${toggle}); print(${html}); print(${toggle})`)
	}	
	return source;
}


/**
 * Parses the JAVASCRIPT code for the @show command and replaces it with the image.
 * @param source The source code to parse.
 */
function jsParseShowImage(source: string): string {
	const matches = source.matchAll(SHOW_REGEX);
	for (const match of matches) {
		const imagePath = match.groups.path;
		const width = match.groups.width;
		const height = match.groups.height;
		const alignment = match.groups.align;

		const image = buildMagicShowImage(imagePath.replace(/\\/g, "\\\\"), width, height, alignment);

		source = source.replace(match[0], "console.log(\'" + TOGGLE_HTML_SIGIL + image + TOGGLE_HTML_SIGIL + "\')");
		console.log(source);
	}

	return source;
}

function jsParseHtmlFunction(source: string): string {
	const matches = source.matchAll(HTML_REGEX);
	for (const match of matches) {
		const html = match.groups.html;

		const toggle = JSON.stringify(TOGGLE_HTML_SIGIL);

		source = source.replace(match[0], `console.log(${toggle}); console.log(${html}); console.log(${toggle})`)
	}
	return source;
}


/**
 * Builds the image string that is used to display the image in the note based on the configurations for
 * height, width and alignment.
 *
 * @param imagePath The path to the image.
 * @param width The image width.
 * @param height The image height.
 * @param alignment The image alignment.
 */
function buildMagicShowImage(imagePath: string, width: string = "0", height: string = "0", alignment: string = "center"): string {
	if (imagePath.contains("+")) {
		let splittedPath = imagePath.replace(/['"]/g, "").split("+");
		splittedPath = splittedPath.map(element => element.trim())
		imagePath = splittedPath.join("");
	}

	if (width == "0" || height == "0")
		return `<img src="${imagePath}" align="${alignment}" alt="Image found at path ${imagePath}." />`;

	return `<img src="${imagePath}" width="${width}" height="${height}" align="${alignment}" alt="Image found at path ${imagePath}." />`;
}
