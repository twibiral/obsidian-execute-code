import {App, MarkdownView, Notice} from "obsidian";
import {insertNotePath, insertNoteTitle, insertVaultPath} from "./Magic";
import {getVaultVariables} from "./Vault";
import type {ExecutorSettings, ExecutorSettingsLanguages} from "./Settings";

/**
 * Arguments for code blocks, specified next to the language identifier as JSON
 * @example ```python {"export": "pre"}
 * @example ```cpp {"ignoreExport": ["post"]}
 * @example ```js {"import": ["helper", "linkedList:listNode", {"tree": ["treeNode"]}]}
 */
interface CodeBlockArgs {
	label?: string;
	import?: (string | {[document: string]: string[]})[];
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
		.replace("bash", "shell") as ExecutorSettingsLanguages;
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
		return JSON.parse(`{${firstLineOfCode.substring(firstLineOfCode.indexOf("{") + 1)}`);
	}
	catch (err) {
		new Notice(`Failed to parse code block args:\n${err}`);
		return {};
	}
}

/**
 * Extract the language from the first line of a code block.
 * 
 * @param firstLineOfCode The first line of a code block that contains the language name.
 * @returns The language of the code block.
 */
function getCodeBlockLanguage(firstLineOfCode: string) {
	return getLanguageAlias(firstLineOfCode.split("```")[1].trim().split(" ")[0].split("{")[0])
}

export class CodeInjector {
	private app: App;

	private prependSrcCode = "";
	private appendSrcCode = "";
	private namedImportSrcCode = "";

	private mainArgs: CodeBlockArgs = {};

	private namedExports: Record<string, string> = {};
	private exportsFromDocuments: Record<string, Record<string, string>> = {};
	
	/**
	 * @param app The current app handle (this.app from ExecuteCodePlugin).
	 */
	constructor(app: App) {
		this.app = app;
	}	

	/**
	 * Handles adding named imports to code blocks
	 * 
	 * @param namedImports TODO
	 * @param language TODO
	 */
	private async handleNamedImports(namedImports: CodeBlockArgs['import'], language: ExecutorSettingsLanguages) {
		for (const namedImport of namedImports) {
			// Non-object entry - local import
			if (typeof namedImport === "string") {
				// Named export doesn't exist
				if (!this.namedExports.hasOwnProperty(namedImport)) {
					new Notice(`Named export ${namedImport} does not exist but was imported`);
					return true;
				}
				this.namedImportSrcCode += `${this.namedExports[namedImport]}\n`;
			}
			
		}
		return false;
	}

	/**
	 * TODO
	 * @param fileContents 
	 * @param language 
	 * @param isOriginalFile 
	 * @param srcCode 
	 * @returns 
	 */
	private async parseFile(fileContents: string, language: ExecutorSettingsLanguages, isOriginalFile = false, srcCode = "") {
		let currentArgs: CodeBlockArgs = {};
		let insideCodeBlock = false;
		let isLanguageEqual = false;
		let currentLanguage = "";
		let currentCode = "";
		let currentFirstLine = "";

		for (const line of fileContents.split("\n")) {
			if (line.startsWith("```")) {
				// Reached end of code block
				if (insideCodeBlock) {
					// Stop traversal once we've reached the code block being run
					// Only do this for the original file the user is running
					if (isOriginalFile) {
						const srcCodeTrimmed = srcCode.trim();
						const currentCodeTrimmed = currentCode.trim();
						if (isLanguageEqual && srcCodeTrimmed.length === currentCodeTrimmed.length && srcCodeTrimmed === currentCodeTrimmed) {
							this.mainArgs = getArgs(currentFirstLine);
							// Get named imports
							if (this.mainArgs.import) {
								const err = this.handleNamedImports(this.mainArgs.import, language);
								if (err) return "";
							}
							break;
						}
					}
					// Named export
					if (currentArgs.label) {
						// Export already exists
						if (this.namedExports.hasOwnProperty(currentArgs.label)) {
							new Notice(`Error: named export ${currentArgs.label} exported more than once`);
							return "";
						}
						this.namedExports[currentArgs.label] = currentCode;
					}
					// Pre / post export
					if (currentArgs.export === "pre")
						this.prependSrcCode += `${currentCode}\n`;
					else if (currentArgs.export === "post")
						this.appendSrcCode += `${currentCode}\n`;
					currentLanguage = "";
					currentCode = "";
					insideCodeBlock = false;

				}
				// reached start of code block
				else {
					currentLanguage = getCodeBlockLanguage(line);
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
	}

	/**
	 * Takes the source code of a code block and adds all relevant pre-/post-blocks and global code injections.
	 *
	 * @param srcCode The source code of the code block.
	 * @param settings The current app settings.
	 * @param _language The language of the code block e.g. python, js, cpp.
	 * @returns The source code of a code block with all relevant pre/post blocks and global code injections.
	 */
	public async injectCode(srcCode: string, settings: ExecutorSettings, _language: ExecutorSettingsLanguages) {
	
		console.time('injectCode');
	
		const language = getLanguageAlias(_language);
	
		// We need to get access to all code blocks on the page so we can grab the pre / post blocks above
		// Obsidian unloads code blocks not in view, so instead we load the raw document file and traverse line-by-line
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView === null) {
			return srcCode;
		}

		const fileContents = activeView.data;
		this.parseFile(fileContents, language, true, srcCode);
		
		const realLanguage = /[^-]*$/.exec(language)[0];
		let injectedCode = `${this.namedImportSrcCode}\n${srcCode}`;
		if (!this.mainArgs.ignoreExport)
			injectedCode = `${settings[`${realLanguage}Inject` as keyof ExecutorSettings]}\n${this.prependSrcCode}\n${injectedCode}\n${this.appendSrcCode}`;
		else if (this.mainArgs.ignoreExport !== "all") {
			if (!this.mainArgs.ignoreExport.contains("pre"))
				injectedCode = `${this.prependSrcCode}\n${injectedCode}`;
			if (!this.mainArgs.ignoreExport.contains("post"))
				injectedCode = `${injectedCode}\n${this.appendSrcCode}`;
			if (!this.mainArgs.ignoreExport.contains("global"))
				injectedCode = `${settings[`${realLanguage}Inject` as keyof ExecutorSettings]}\n${injectedCode}`;
		}
	
		console.timeEnd('injectCode');
	
		return transformCode(this.app, injectedCode);
	}	
}
