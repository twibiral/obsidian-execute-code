/*
 * Adds functions that parse source code for magic commands and transpile them to the target language.
 *
 * List of Magic Commands:
 * - `@show(ImagePath)`: Displays an image at the given path in the note.
 * - `@show(ImagePath, Width, Height)`: Displays an image at the given path in the note.
 * - `@show(ImagePath, Width, Height, Alignment)`: Displays an image at the given path in the note.
 */

const SHOW_REGEX = /@show\(["'](?<path>[^,<>"'?*=]+)["'](,\s*(?<width>[0-9]+[\w%]+),?\s*(?<height>[0-9]+[\w%]+))?(,\s*(?<align>left|center|right))?\)/g;

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
	if (width == "0" || height == "0")
		return `<img src="${imagePath}" align="${alignment}">`;

	return `<img src="${imagePath}" width="${width}" height="${height}" align="${alignment}">`;
}
