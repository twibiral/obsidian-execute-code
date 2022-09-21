import {App} from "obsidian";
import {insertNotePath, insertNoteTitle, insertVaultPath} from "./Magic";
import {getVaultVariables} from "./Vault";
import type {ExecutorSettings, ExecutorSettingsLanguages} from "./Settings";

/**
 * Transform a language name, to enable working with multiple language aliases, for example "js" and "javascript".
 *
 * @param language A language name or shortcut (e.g. 'js', 'python' or 'shell')
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
 * @param app The current app handle (this.app from ExecuteCodePlugin)
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
 * Takes the source code of a code block and adds all relevant pre-/post-blocks and global code injections.
 *
 * @param app The current app handle (this.app from ExecuteCodePlugin)
 * @param srcCode The source code of the code block.
 * @param settings The current app settings
 * @param _language The language of the code block.
 * @returns
 */
export async function injectCode(app: App, srcCode: string, settings: ExecutorSettings, _language: ExecutorSettingsLanguages) {
	let prependSrcCode = "";
	let appendSrcCode = "";

	const language = getLanguageAlias(_language);
	const preLangName = `pre-${language}`;
	const postLangName = `post-${language}`;

	// We need to get access to all code blocks on the page so we can grab the pre / post blocks above
	// Obsidian unloads code blocks not in view, so instead we load the raw document file and traverse line-by-line
	const activeFile = app.workspace.getActiveFile();
	const fileContents = await app.vault.read(activeFile);

	let insideCodeBlock = false;
	let isLanguageEqual = false;
	let currentLanguage = "";
	let currentCode = "";

	for (const line of fileContents.split('\n')) {
		if (line.startsWith("```")) {
			if (insideCodeBlock) {
				// Stop traversal once we've reached the code block being run
				const srcCodeTrimmed = srcCode.trim();
				const currentCodeTrimmed = currentCode.trim();
				if (isLanguageEqual && srcCodeTrimmed.length === currentCodeTrimmed.length && srcCodeTrimmed === currentCodeTrimmed)
					break;
				if (currentLanguage === preLangName)
					prependSrcCode += `${currentCode}\n`;
				else if (currentLanguage === postLangName)
					appendSrcCode += `${currentCode}\n`;
				currentLanguage = "";
				currentCode = "";
				insideCodeBlock = false;
			} else {
				currentLanguage = getLanguageAlias(line.split("```")[1].trim().split(" ")[0]);
				// Don't check code blocks from a different language
				isLanguageEqual = /[^-]*$/.exec(language)[0] === /[^-]*$/.exec(currentLanguage)[0];
				insideCodeBlock = true;
			}
		} else if (insideCodeBlock) {
			currentCode += `${line}\n`;
		}
	}

	const realLanguage = /[^-]*$/.exec(language)[0];
	const injectedCode = `${settings[`${realLanguage}Inject` as keyof ExecutorSettings]}\n${prependSrcCode}\n${srcCode}\n${appendSrcCode}`;
	return transformCode(app, injectedCode);
}
