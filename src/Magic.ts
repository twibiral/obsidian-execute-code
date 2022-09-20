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

// Regex for all languages.
const SHOW_REGEX = /@show\(["'](?<path>[^<>?*=!\n#()\[\]{}]+)["'](,\s*(?<width>\d+[\w%]+),?\s*(?<height>\d+[\w%]+))?(,\s*(?<align>left|center|right))?\)/g;
const VAULT_REGEX = /@vault/g
const CURRENT_NOTE_REGEX = /@note/g;
const NOTE_TITLE_REGEX = /@title/g;

// Regex that are only used by one language.
const PYTHON_PLOT_REGEX = /^(plt|matplotlib.pyplot|pyplot)\.show\(\)/gm;
const R_PLOT_REGEX = /^plot\(.*\)/gm;

export function insertVaultPath(source: string, vaultPath: string): string {
	return source.replace(VAULT_REGEX, `"app://local/${vaultPath.replace(/\\/g, "/")}"`);
}

export function insertNotePath(source: string, notePath: string): string {
	return source.replace(CURRENT_NOTE_REGEX, `"app://local/${notePath.replace(/\\/g, "/")}"`);
}

export function insertNoteTitle(source: string, noteTitle: string): string {
	let t = "";
	if (noteTitle.contains("."))
		t = noteTitle.split(".").slice(0, -1).join(".");

	return source.replace(NOTE_TITLE_REGEX, `"${t}"`);
}

export function addInlinePlotsToPython(source: string): string {
	const showPlot = `import io; import sys; __obsidian_execute_code_temp_pyplot_var__=io.BytesIO(); plt.plot(); plt.savefig(__obsidian_execute_code_temp_pyplot_var__, format='svg'); plt.close(); sys.stdout.buffer.write(__obsidian_execute_code_temp_pyplot_var__.getvalue())`;
	return source.replace(PYTHON_PLOT_REGEX, showPlot);
}

export function addInlinePlotsToR(source: string): string {
	const matches = source.matchAll(R_PLOT_REGEX);
	for (const match of matches) {
		const tempFile = `${os.tmpdir()}/temp_${Date.now()}.png`.replace(/\\/g, "/");
		const substitute = `png("${tempFile}"); ${match[0]}; dev.off(); cat('<img src="app://local/${tempFile}" align="center">')`;


		source = source.replace(match[0], substitute);
	}

	return source;
}

export function addMagicToPython(source: string): string {
	source = pythonParseShowImage(source);
	return source;
}

export function addMagicToJS(source: string): string {
	source = jsParseShowImage(source);
	return source;
}


function pythonParseShowImage(source: string): string {
	const matches = source.matchAll(SHOW_REGEX);
	for (const match of matches) {
		const imagePath = match.groups.path;
		const width = match.groups.width;
		const height = match.groups.height;
		const alignment = match.groups.align;

		const image = buildMagicShowImage(imagePath.replace(/\\/g, "\\\\"), width, height, alignment);
		source = source.replace(match[0], "print(\'" + image + "\')");
	}

	return source;
}

function jsParseShowImage(source: string): string {
	const matches = source.matchAll(SHOW_REGEX);
	for (const match of matches) {
		const imagePath = match.groups.path;
		const width = match.groups.width;
		const height = match.groups.height;
		const alignment = match.groups.align;

		const image = buildMagicShowImage(imagePath.replace(/\\/g, "\\\\"), width, height, alignment);
		source = source.replace(match[0], "console.log(\'" + image + "\')");
		console.log(source);
	}

	return source;
}

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
