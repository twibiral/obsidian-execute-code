import {FileView, MarkdownRenderer, Plugin} from 'obsidian';

import {Outputter, TOGGLE_HTML_SIGIL} from "./Outputter";
import type {ExecutorSettings} from "./settings/Settings";
import {DEFAULT_SETTINGS} from "./settings/Settings";
import {SettingsTab} from "./settings/SettingsTab";
import {getLanguageAlias} from './transforms/TransformCode';
import {CodeInjector} from "./transforms/CodeInjector";
import {addInlinePlotsToPython, addInlinePlotsToR, addMagicToJS, addMagicToPython,} from "./transforms/Magic";

import ExecutorContainer from './ExecutorContainer';
import ExecutorManagerView, {
	EXECUTOR_MANAGER_OPEN_VIEW_COMMAND_ID,
	EXECUTOR_MANAGER_VIEW_ID
} from './ExecutorManagerView';

import runAllCodeBlocks from './runAllCodeBlocks';

export const languageAliases = ["javascript", "typescript", "bash", "csharp", "wolfram", "nb", "wl", "hs"] as const;
export const canonicalLanguages = ["js", "ts", "cs", "lua", "python", "cpp",
	"prolog", "shell", "groovy", "r", "go", "rust", "java", "powershell", "kotlin", "mathematica", "haskell"] as const;
export const supportedLanguages = [...languageAliases, ...canonicalLanguages] as const;


// type SupportedLanguage = typeof supportedLanguages[number];
export type LanguageId = typeof canonicalLanguages[number];

const buttonText = "Run";

export const runButtonClass = "run-code-button";
const runButtonDisabledClass = "run-button-disabled";
const hasButtonClass = "has-run-code-button";


export default class ExecuteCodePlugin extends Plugin {
	settings: ExecutorSettings;
	executors: ExecutorContainer;

	/**
	 * Preparations for the plugin (adding buttons, html elements and event listeners).
	 */
	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));

		this.executors = new ExecutorContainer(this);

		this.iterateOpenFilesAndAddRunButtons();
		this.registerMarkdownPostProcessor((element, _context) => {
			this.addRunButtons(element, _context.sourcePath);
		});

		// live preview renderers
		supportedLanguages.forEach(l => {
			console.debug(`Registering renderer for ${l}.`)
			this.registerMarkdownCodeBlockProcessor(`run-${l}`, async (src, el, _ctx) => {
				await MarkdownRenderer.renderMarkdown('```' + l + '\n' + src + (src.endsWith('\n') ? '' : '\n') + '```', el, '', null);
			});
		});

		//executor manager

		this.registerView(
			EXECUTOR_MANAGER_VIEW_ID, (leaf) => new ExecutorManagerView(leaf, this.executors)
		);
		this.addCommand({
			id: EXECUTOR_MANAGER_OPEN_VIEW_COMMAND_ID,
			name: "Open Code Runtime Management",
			callback: () => ExecutorManagerView.activate(this.app.workspace)
		});

		this.addCommand({
			id: "run-all-code-blocks-in-file",
			name: "Run all Code Blocks in Current File",
			callback: () => runAllCodeBlocks(this.app.workspace)
		})
	}

	/**
	 *  Remove all generated html elements (run & clear buttons, output elements) when the plugin is disabled.
	 */
	onunload() {
		document
			.querySelectorAll("pre > code")
			.forEach((codeBlock: HTMLElement) => {
				const pre = codeBlock.parentElement as HTMLPreElement;
				const parent = pre.parentElement as HTMLDivElement;

				if (parent.hasClass(hasButtonClass)) {
					parent.removeClass(hasButtonClass);
				}
			});

		document
			.querySelectorAll("." + runButtonClass)
			.forEach((button: HTMLButtonElement) => button.remove());

		document
			.querySelectorAll("." + runButtonDisabledClass)
			.forEach((button: HTMLButtonElement) => button.remove());

		document
			.querySelectorAll(".clear-button")
			.forEach((button: HTMLButtonElement) => button.remove());

		document
			.querySelectorAll(".language-output")
			.forEach((out: HTMLElement) => out.remove());

		for (const executor of this.executors) {
			executor.stop().then(_ => { /* do nothing */ });
		}

		console.log("Unloaded plugin: Execute Code");
	}

	/**
	 * Loads the settings for this plugin from the corresponding save file and stores them in {@link settings}.
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Saves the settings in {@link settings} to the corresponding save file.
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Adds run buttons to each open file. This is more robust and quicker than scanning
	 * the entire document, even though it requires more iteration, because it doesn't
	 * search the whole document.
	 */
	private iterateOpenFilesAndAddRunButtons() {
		this.app.workspace.iterateRootLeaves(leaf => {
			if (leaf.view instanceof FileView) {
				this.addRunButtons(leaf.view.contentEl, leaf.view.file.path);
			}
		})
	}

	/**
	 * Add a button to each code block that allows the user to run the code. The button is only added if the code block
	 * utilizes a language that is supported by this plugin.
	 *
	 * @param element The parent element (i.e. the currently showed html page / note).
	 * @param file An identifier for the currently showed note
	 */
	private addRunButtons(element: HTMLElement, file: string) {
		Array.from(element.getElementsByTagName("code"))
			.forEach((codeBlock: HTMLElement) => {
				if (codeBlock.className.match(/^language-\{\w+/i)){
					codeBlock.className = codeBlock.className.replace(/^language-\{(\w+)/i, "language-$1 {");
					codeBlock.parentElement.className = codeBlock.className;
				}

				const language = codeBlock.className.toLowerCase();

				if (!language || !language.contains("language-"))
					return;

				const pre = codeBlock.parentElement as HTMLPreElement;
				const parent = pre.parentElement as HTMLDivElement;

				const srcCode = codeBlock.getText();

				const canonicalLanguage = getLanguageAlias(
					supportedLanguages.find(lang => codeBlock.classList.contains(`language-${lang}`))
				) as LanguageId;

				if (canonicalLanguage // if the language is supported
					&& !parent.classList.contains(hasButtonClass)) { // & this block hasn't been buttonified already
					const out = new Outputter(codeBlock, this.settings.allowInput);
					parent.classList.add(hasButtonClass);
					const button = this.createRunButton();
					pre.appendChild(button);
					this.addListenerToButton(canonicalLanguage, srcCode, button, out, file);
				}
			});
	}

	/**
	 * Add a listener to the run button that executes the code block on click.
	 * Adds a different kind of listener for each supported language.
	 *
	 * @param language The programming language used in the code block.
	 * @param srcCode The code in the code block.
	 * @param button The button element to which the listener is added.
	 * @param out The {@link Outputter} object that is used to display the output of the code.
	 * @param file The file that the code originates in
	 */
	private addListenerToButton(language: LanguageId, srcCode: string, button: HTMLButtonElement, out: Outputter, file: string) {
		if (language === "js") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				let transformedCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);
				transformedCode = addMagicToJS(transformedCode);
				this.runCode(transformedCode, out, button, this.settings.nodePath, this.settings.nodeArgs, "js", language, file);
			});

		} else if (language === "java") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				const transformedCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);
				this.runCode(transformedCode, out, button, this.settings.javaPath, this.settings.javaArgs, this.settings.javaFileExtension, language, file);
			});

		} else if (language === "python") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				let transformedCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);
				if (this.settings.pythonEmbedPlots)	// embed plots into html which shows them in the note
					transformedCode = addInlinePlotsToPython(transformedCode, TOGGLE_HTML_SIGIL);
				transformedCode = addMagicToPython(transformedCode);

				this.runCode(transformedCode, out, button, this.settings.pythonPath, this.settings.pythonArgs, "py", language, file);
			});

		} else if (language === "shell") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);
				this.runCodeInShell(transformedCode, out, button, this.settings.shellPath, this.settings.shellArgs, this.settings.shellFileExtension, language, file);
			});

		} else if (language === "powershell") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);
				this.runCodeInShell(transformedCode, out, button, this.settings.powershellPath, this.settings.powershellArgs, this.settings.powershellFileExtension, language, file);
			});

		} else if (language === "cpp") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);
				this.runCode(transformedCode, out, button, this.settings.clingPath, `-std=${this.settings.clingStd} ${this.settings.clingArgs}`, "cpp", language, file);
			});

		} else if (language === "prolog") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = (await new CodeInjector(this.app, this.settings, language).injectCode(srcCode));
				this.runCode(transformedCode, out, button, "", "", "", language, file);
				button.className = runButtonClass;
			});

		} else if (language === "groovy") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				const transformedCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);
				this.runCodeInShell(transformedCode, out, button, this.settings.groovyPath, this.settings.groovyArgs, this.settings.groovyFileExtension, language, file);
			});

		} else if (language === "rust") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				const transformedCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);
				this.runCode(transformedCode, out, button, this.settings.cargoPath, this.settings.cargoArgs, this.settings.rustFileExtension, language, file);
			});

		} else if (language === "r") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				let transformedCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);
				transformedCode = addInlinePlotsToR(transformedCode);


				this.runCode(transformedCode, out, button, this.settings.RPath, this.settings.RArgs, "R", language, file);
			});

		} else if (language === "go") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);
				this.runCode(transformedCode, out, button, this.settings.golangPath, this.settings.golangArgs, this.settings.golangFileExtension, language, file);
			});

		} else if (language === "kotlin") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);
				this.runCodeInShell(transformedCode, out, button, this.settings.kotlinPath, this.settings.kotlinArgs, this.settings.kotlinFileExtension, language, file);
			});

		} else if (language === "ts") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);
				this.runCodeInShell(transformedCode, out, button, this.settings.tsPath, this.settings.tsArgs, "ts", language, file);
			});

		} else if (language === "lua") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);
				this.runCodeInShell(transformedCode, out, button, this.settings.luaPath, this.settings.luaArgs, "lua", language, file);
			});

		} else if (language === "cs") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);
				this.runCodeInShell(transformedCode, out, button, this.settings.csPath, this.settings.csArgs, "csx", language, file);
			});

		} else if (language === "haskell") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				 const transformedCode = await new CodeInjector(this.app, this.settings, "haskell").injectCode(srcCode);
				 this.runCodeInShell(transformedCode, out, button, this.settings.useGhci ? this.settings.ghciPath : this.settings.runghcPath, this.settings.useGhci ? "" : "-f "+this.settings.ghcPath, "hs", language, file);
			});

		} else if (language === "mathematica") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);
				this.runCodeInShell(transformedCode, out, button, this.settings.csPath, this.settings.csArgs, this.settings.mathematicaFileExtension, language, file);
			});
		}
	}

	/**
	 * Creates a new run button and returns it.
	 *
	 * @returns { HTMLButtonElement } The newly created run button.
	 */
	private createRunButton() {
		console.debug("Add run button");
		const button = document.createElement("button");
		button.classList.add(runButtonClass);
		button.setText(buttonText);
		return button;
	}

	/**
	 * Executes the code with the given command and arguments. The code is written to a temporary file and then executed.
	 * The output of the code is displayed in the output panel ({@link Outputter}).
	 * If the code execution fails, an error message is displayed and logged.
	 * After the code execution, the temporary file is deleted and the run button is re-enabled.
	 *
	 * @param codeBlockContent The content of the code block that should be executed.
	 * @param outputter The {@link Outputter} that should be used to display the output of the code.
	 * @param button The button that was clicked to execute the code. Is re-enabled after the code execution.
	 * @param cmd The command that should be used to execute the code. (e.g. python, java, ...)
	 * @param cmdArgs Additional arguments that should be passed to the command.
	 * @param ext The file extension of the temporary file. Should correspond to the language of the code. (e.g. py, ...)
	 * @param language The canonical ID of the language being run
	 * @param file The address of the file which the code originates from
	 */
	private runCode(codeBlockContent: string, outputter: Outputter, button: HTMLButtonElement, cmd: string, cmdArgs: string, ext: string, language: LanguageId, file: string) {
		const executor = this.executors.getExecutorFor(file, language, false);
		executor.run(codeBlockContent, outputter, cmd, cmdArgs, ext).then(() => {
			button.className = runButtonClass;
			outputter.closeInput();
		});
	}

	/**
	 * Executes the code with the given command and arguments. The code is written to a temporary file and then executed.
	 * This is equal to {@link runCode} but the code is executed in a shell. This is necessary for some languages like groovy.
	 *
	 * @param codeBlockContent The content of the code block that should be executed.
	 * @param outputter The {@link Outputter} that should be used to display the output of the code.
	 * @param button The button that was clicked to execute the code. Is re-enabled after the code execution.
	 * @param cmd The command that should be used to execute the code. (e.g. python, java, ...)
	 * @param cmdArgs Additional arguments that should be passed to the command.
	 * @param ext The file extension of the temporary file. Should correspond to the language of the code. (e.g. py, ...)
	 * @param language The canonical ID of the language being run
	 * @param file The address of the file which the code originates from
	 */
	private runCodeInShell(codeBlockContent: string, outputter: Outputter, button: HTMLButtonElement, cmd: string, cmdArgs: string, ext: string, language: LanguageId, file: string) {
		const executor = this.executors.getExecutorFor(file, language, true);
		executor.run(codeBlockContent, outputter, cmd, cmdArgs, ext).then(() => {
			button.className = runButtonClass;
		});
	}
}
