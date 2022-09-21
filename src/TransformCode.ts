import {App, MarkdownView, Notice} from "obsidian";
import {insertNotePath, insertNoteTitle, insertVaultPath} from "./Magic";
import {getVaultVariables} from "./Vault";
import type {ExecutorSettings, ExecutorSettingsLanguages} from "./Settings";

interface CodeBlockArgs {
	export?: "pre" | "post";
	ignoreExport?: ("pre" | "post" | "global")[] | "all";
}

/**
 * Transform a language name, to enable working with multiple language aliases, for example "js" and "javascript".
 *
 * @param language A language name or shortcut (e.g. 'js', 'python' or 'shell').
 * @returns The same language shortcut for every alias of the language.
 */
function getLanguageAlias(language: string) {
	return language
		.replace("javascript", "js")
		.replace("bash", "shell");
}

/**
 * Perform magic on source code (parse the magic commands) to insert note path, title, vault path, etc.
 *
 * @param app The current app handle (this.app from ExecuteCodePlugin).
 * @param srcCode Code with magic commands.
 * @returns The input code with magic commands replaced.
 */
function transformCode(app: App, srcCode: string) {
	let ret = srcCode;
	const vars = getVaultVariables(app);
	if (vars) {
		ret = insertVaultPath(ret, vars.vaultPath);
		ret = insertNotePath(ret, vars.filePath);
		ret = insertNoteTitle(ret, vars.fileName);
	} else {
		console.warn(`Could not load all Vault variables! ${vars}`)
	}
	return ret;
}

/**
 * Get code block args given the first line of the code block.
 * 
 * @param firstLineOfCode The first line of a code block that contains the language name.
 * @returns The arguments from the first line of the code block.
 */
function getArgs(firstLineOfCode: string): CodeBlockArgs {
	// No args specified
	if (!firstLineOfCode.contains("{") && !firstLineOfCode.contains("}"))
		return {};
	try {
		return JSON.parse(`{${firstLineOfCode.split("{")[1].split("}")[0]}}`);
	}
	catch (err) {
		new Notice(`Failed to parse code block args:\n${err}`);
		return {};
	}
}

/**
 * Takes the source code of a code block and adds all relevant pre-/post-blocks and global code injections.
 *
 * @param app The current app handle (this.app from ExecuteCodePlugin)
 * @param srcCode The source code of the code block.
 * @param settings The current app settings.
 * @param _language The language of the code block.
 * @returns The source code of a code block with all relevant pre/post blocks and global code injections.
 */
 export async function injectCode(app: App, srcCode: string, settings: ExecutorSettings, _language: ExecutorSettingsLanguages) {
	let prependSrcCode = "";
	let appendSrcCode = "";

	console.time('injectCode');

	const language = getLanguageAlias(_language);

	// We need to get access to all code blocks on the page so we can grab the pre / post blocks above
	// Obsidian unloads code blocks not in view, so instead we load the raw document file and traverse line-by-line
	const activeView = app.workspace.getActiveViewOfType(MarkdownView);
	if (activeView === null) {
		return "";
	}
	const fileContents = activeView.data;

	let mainArgs: CodeBlockArgs = {};
	let currentArgs: CodeBlockArgs = {};
	let insideCodeBlock = false;
	let isLanguageEqual = false;
	let currentLanguage = "";
	let currentCode = "";
	let currentFirstLine = "";

	for (const line of fileContents.split("\n")) {
		if (line.startsWith("```")) {
			if (insideCodeBlock) {
				// Stop traversal once we've reached the code block being run
				const srcCodeTrimmed = srcCode.trim();
				const currentCodeTrimmed = currentCode.trim();
				if (isLanguageEqual && srcCodeTrimmed.length === currentCodeTrimmed.length && srcCodeTrimmed === currentCodeTrimmed) {
					mainArgs = getArgs(currentFirstLine);
					break;
				}
				if (currentArgs.export === "pre")
					prependSrcCode += `${currentCode}\n`;
				else if (currentArgs.export === "post")
					appendSrcCode += `${currentCode}\n`;
				currentLanguage = "";
				currentCode = "";
				insideCodeBlock = false;
			} else {
				currentLanguage = getLanguageAlias(line.split("```")[1].trim().split(" ")[0].split("{")[0]);
				// Don't check code blocks from a different language
				isLanguageEqual = /[^-]*$/.exec(language)[0] === /[^-]*$/.exec(currentLanguage)[0];
				if (isLanguageEqual) {
					currentArgs = getArgs(line);
					currentFirstLine = line;
				}
				insideCodeBlock = true;
			}
		} else if (insideCodeBlock && isLanguageEqual) {
			currentCode += `${line}\n`;
		}
	}
	const realLanguage = /[^-]*$/.exec(language)[0];
	let injectedCode = srcCode;
	if (!mainArgs.ignoreExport)
		injectedCode = `${settings[`${realLanguage}Inject` as keyof ExecutorSettings]}\n${prependSrcCode}\n${srcCode}\n${appendSrcCode}`;
	else if (mainArgs.ignoreExport !== "all") {
		if (!mainArgs.ignoreExport.contains("pre"))
			injectedCode = `${prependSrcCode}\n${injectedCode}`;
		if (!mainArgs.ignoreExport.contains("post"))
			injectedCode = `${injectedCode}\n${appendSrcCode}`;
		if (!mainArgs.ignoreExport.contains("global"))
			injectedCode = `${settings[`${realLanguage}Inject` as keyof ExecutorSettings]}\n${injectedCode}`;
	}

	console.timeEnd('injectCode');

	return transformCode(app, injectedCode);
}
