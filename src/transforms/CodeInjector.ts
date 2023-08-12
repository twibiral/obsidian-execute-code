import type {App} from "obsidian";
import {MarkdownView, Notice} from "obsidian";
import {ExecutorSettings} from "src/settings/Settings";
import {getCodeBlockLanguage, getLanguageAlias, transformMagicCommands} from './TransformCode';
import {getArgs} from "src/CodeBlockArgs";
import type {LanguageId} from "src/main";
import type {CodeBlockArgs} from '../CodeBlockArgs';

/**
 * Inject code and run code transformations on a source code block
 */
export class CodeInjector {
	private readonly app: App;
	private readonly settings: ExecutorSettings;
	private readonly language: LanguageId;

	private prependSrcCode = "";
	private appendSrcCode = "";
	private namedImportSrcCode = "";

	private mainArgs: CodeBlockArgs = {};

	private namedExports: Record<string, string> = {};

	/**
	 * @param app The current app handle (this.app from ExecuteCodePlugin).
	 * @param settings The current app settings.
	 * @param language The language of the code block e.g. python, js, cpp.
	 */
	constructor(app: App, settings: ExecutorSettings, language: LanguageId) {
		this.app = app;
		this.settings = settings;
		this.language = language;
	}

	/**
	 * Takes the source code of a code block and adds all relevant pre-/post-blocks and global code injections.
	 *
	 * @param srcCode The source code of the code block.
	 * @returns The source code of a code block with all relevant pre/post blocks and global code injections.
	 */
	public async injectCode(srcCode: string) {
		const language = getLanguageAlias(this.language);

		// We need to get access to all code blocks on the page so we can grab the pre / post blocks above
		// Obsidian unloads code blocks not in view, so instead we load the raw document file and traverse line-by-line
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView === null)
			return srcCode;

		// Is await necessary here? Some object variables get changed in this call -> await probably necessary
		await this.parseFile(activeView.data, srcCode, language);

		const realLanguage = /[^-]*$/.exec(language)[0];
		const globalInject = this.settings[`${realLanguage}Inject` as keyof ExecutorSettings];
		let injectedCode = `${this.namedImportSrcCode}\n${srcCode}`;
		if (!this.mainArgs.ignore)
			injectedCode = `${globalInject}\n${this.prependSrcCode}\n${injectedCode}\n${this.appendSrcCode}`;
		else {
			// Handle single ignore
			if (!Array.isArray(this.mainArgs.ignore) && this.mainArgs.ignore !== "all")
				this.mainArgs.ignore = [this.mainArgs.ignore];
			if (this.mainArgs.ignore !== "all") {
				if (!this.mainArgs.ignore.contains("pre"))
					injectedCode = `${this.prependSrcCode}\n${injectedCode}`;
				if (!this.mainArgs.ignore.contains("post"))
					injectedCode = `${injectedCode}\n${this.appendSrcCode}`;
				if (!this.mainArgs.ignore.contains("global"))
					injectedCode = `${globalInject}\n${injectedCode}`;
			}
		}
		return transformMagicCommands(this.app, injectedCode);
	}

	/**
	 * Handles adding named imports to code blocks
	 *
	 * @param namedImports Populate prependable source code with named imports
	 * @returns If an error occurred
	 */
	private async handleNamedImports(namedImports: CodeBlockArgs['import']) {
		const handleNamedImport = (namedImport: string) => {
			// Named export doesn't exist
			if (!this.namedExports.hasOwnProperty(namedImport)) {
				new Notice(`Named export "${namedImport}" does not exist but was imported`);
				return true;
			}
			this.namedImportSrcCode += `${this.namedExports[namedImport]}\n`;
			return false;
		};
		// Single import
		if (!Array.isArray(namedImports))
			return handleNamedImport(namedImports);
		// Multiple imports
		for (const namedImport of namedImports) {
			const err = handleNamedImport(namedImport);
			if (err) return true;
		}
		return false;
	}

	/**
	 * Parse a markdown file
	 *
	 * @param fileContents The contents of the file to parse
	 * @param srcCode The original source code of the code block being run
	 * @param language The programming language of the code block being run
	 * @returns
	 */
	private async parseFile(fileContents: string, srcCode: string, language: LanguageId) {
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
					const srcCodeTrimmed = srcCode.trim();
					const currentCodeTrimmed = currentCode.trim();
					if (isLanguageEqual && srcCodeTrimmed.length === currentCodeTrimmed.length && srcCodeTrimmed === currentCodeTrimmed) {
						this.mainArgs = getArgs(currentFirstLine);
						// Get named imports
						if (this.mainArgs.import) {
							const err = this.handleNamedImports(this.mainArgs.import);
							if (err) return "";
						}
						break;
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
					if (!Array.isArray(currentArgs.export))
						currentArgs.export = [currentArgs.export];
					if (currentArgs.export.contains("pre"))
						this.prependSrcCode += `${currentCode}\n`;
					if (currentArgs.export.contains("post"))
						this.appendSrcCode += `${currentCode}\n`;
					currentLanguage = "";
					currentCode = "";
					insideCodeBlock = false;
					currentArgs = {};
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
}
