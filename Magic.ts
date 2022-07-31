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

const SHOW_REGEX = /@show\(["'](?<path>[^<>?*=!\n#()\[\]{}]+)["'](,\s*(?<width>[0-9]+[\w%]+),?\s*(?<height>[0-9]+[\w%]+))?(,\s*(?<align>left|center|right))?\)/g;
const VAULT_REGEX = /@vault/g
const CURRENT_NOTE_REGEX = /@note/g;
const NOTE_TITLE_REGEX = /@title/g;

export function insertVaultPath(source: string, vaultPath: string): string {
	return source.replace(VAULT_REGEX, `"app://local/${vaultPath.replace(/\\/g, "/")}"`);
}

export function insertNotePath(source: string, notePath: string): string {
	return source.replace(CURRENT_NOTE_REGEX, `"${notePath}"`);
}

export function insertNoteTitle(source: string, noteTitle: string): string {
	return source.replace(NOTE_TITLE_REGEX, `"${noteTitle}"`);
}

export function addInlinePlotsToPython(source: string): string {
	const showPlot = 'import io; __obsidian_execute_code_temp_pyplot_var__=io.StringIO(); plt.plot(); plt.savefig(__obsidian_execute_code_temp_pyplot_var__, format=\'svg\'); plt.close(); print(f"<div align=\\"center\\">{__obsidian_execute_code_temp_pyplot_var__.getvalue()}</div>")'
	return source.replace(/plt\.show\(\)/g, showPlot);
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
		console.log(source);
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
		return `<img src="${imagePath}" align="${alignment}">`;

	return `<img src="${imagePath}" width="${width}" height="${height}" align="${alignment}">`;
}
