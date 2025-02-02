import {
	Component,
	MarkdownRenderer,
	MarkdownView,
	Plugin,
} from 'obsidian';

import { Outputter, TOGGLE_HTML_SIGIL } from "./output/Outputter";
import type { ExecutorSettings } from "./settings/Settings";
import { DEFAULT_SETTINGS } from "./settings/Settings";
import { SettingsTab } from "./settings/SettingsTab";
import { getLanguageAlias } from './transforms/TransformCode';
import { CodeInjector } from "./transforms/CodeInjector";
import {
	addInlinePlotsToPython,
	addInlinePlotsToR,
	addMagicToJS,
	addMagicToPython,
	addInlinePlotsToOctave,
	addInlinePlotsToMaxima
} from "./transforms/Magic";
import { modifyLatexCode, applyLatexBodyClasses } from "./transforms/LatexTransformer"
import { retrieveFigurePath } from './transforms/LatexFigureName';

import ExecutorContainer from './ExecutorContainer';
import ExecutorManagerView, {
	EXECUTOR_MANAGER_OPEN_VIEW_COMMAND_ID,
	EXECUTOR_MANAGER_VIEW_ID
} from './ExecutorManagerView';

import runAllCodeBlocks from './runAllCodeBlocks';
import { ReleaseNoteModel } from "./ReleaseNoteModal";

export const languageAliases = ["javascript", "typescript", "bash", "csharp", "wolfram", "nb", "wl", "hs", "py", "tex"] as const;
export const canonicalLanguages = ["js", "ts", "cs", "latex", "lean", "lua", "python", "cpp", "prolog", "shell", "groovy", "r",
	"go", "rust", "java", "powershell", "kotlin", "mathematica", "haskell", "scala", "swift", "racket", "fsharp", "c", "dart",
	"ruby", "batch", "sql", "octave", "maxima", "applescript", "zig", "ocaml", "php"] as const;
export const supportedLanguages = [...languageAliases, ...canonicalLanguages] as const;
export type LanguageId = typeof canonicalLanguages[number];

const buttonText = "Run";

export const runButtonClass = "run-code-button";
const runButtonDisabledClass = "run-button-disabled";
const hasButtonClass = "has-run-code-button";

interface CodeBlockContext {
	srcCode: string;
	outputter: Outputter;
	button: HTMLButtonElement;
	language: LanguageId;
	markdownFile: string;
}

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
			this.addRunButtons(element, _context.sourcePath, this.app.workspace.getActiveViewOfType(MarkdownView));
		});

		// live preview renderers
		supportedLanguages.forEach(l => {
			console.debug(`Registering renderer for ${l}.`)
			this.registerMarkdownCodeBlockProcessor(`run-${l}`, async (src, el, _ctx) => {
				await MarkdownRenderer.render(this.app, '```' + l + '\n' + src + (src.endsWith('\n') ? '' : '\n') + '```', el, _ctx.sourcePath, new Component());
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

		if (!this.settings.releaseNote2_0_0wasShowed) {
			this.app.workspace.onLayoutReady(() => {
				new ReleaseNoteModel(this.app).open();
			})

			// Set to true to prevent the release note from showing again
			this.settings.releaseNote2_0_0wasShowed = true;
			this.saveSettings();
		}

		applyLatexBodyClasses(this.app, this.settings);
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
			executor.stop().then(_ => { /* do nothing */
			});
		}

		console.log("Unloaded plugin: Execute Code");
	}

	/**
	 * Loads the settings for this plugin from the corresponding save file and stores them in {@link settings}.
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		if (process.platform !== "win32") {
			this.settings.wslMode = false;
		}
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
			if (leaf.view instanceof MarkdownView) {
				this.addRunButtons(leaf.view.contentEl, leaf.view.file.path, leaf.view);
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
	private addRunButtons(element: HTMLElement, file: string, view: MarkdownView) {
		Array.from(element.getElementsByTagName("code"))
			.forEach((codeBlock: HTMLElement) => this.addRunButton(codeBlock, file, view));
	}

	private addRunButton(codeBlock: HTMLElement, file: string, view: MarkdownView) {
		if (codeBlock.className.match(/^language-\{\w+/i)) {
			codeBlock.className = codeBlock.className.replace(/^language-\{(\w+)/i, "language-$1 {");
			codeBlock.parentElement.className = codeBlock.className;
		}

		const language = codeBlock.className.toLowerCase();

		if (!language || !language.contains("language-"))
			return;

		const pre = codeBlock.parentElement as HTMLPreElement;
		const parent = pre.parentElement as HTMLDivElement;

		const srcCode = codeBlock.getText();
		let sanitizedClassList = this.sanitizeClassListOfCodeBlock(codeBlock);

		const canonicalLanguage = getLanguageAlias(
			supportedLanguages.find(lang => sanitizedClassList.contains(`language-${lang}`))
		) as LanguageId;

		const isLanguageSupported: Boolean = canonicalLanguage !== undefined;
		const hasBlockBeenButtonifiedAlready = parent.classList.contains(hasButtonClass);
		if (!isLanguageSupported || hasBlockBeenButtonifiedAlready) return;

		const out = new Outputter(codeBlock, this.settings, view, this.app, file);
		parent.classList.add(hasButtonClass);
		const button = this.createRunButton();
		pre.appendChild(button);

		const block: CodeBlockContext = {
			srcCode: srcCode,
			outputter: out,
			language: canonicalLanguage,
			markdownFile: file,
			button: button,
		};

		button.addEventListener("click", () => this.handleExecution(block));
	}

	private sanitizeClassListOfCodeBlock(codeBlock: HTMLElement) {
		let sanitizedClassList = Array.from(codeBlock.classList);
		return sanitizedClassList.map(c => c.toLowerCase());
	}

/**
	 * Handles the execution of code blocks based on the selected programming language.
 	 * Injects any required code, transforms the source if needed, and manages button state.
	 * @param block Contains context needed for execution including source code, output handler, and UI elements
	 */
	private async handleExecution(block: CodeBlockContext) {
		const language: LanguageId = block.language;
		const button: HTMLButtonElement = block.button;
		const srcCode: string = block.srcCode;

		button.className = runButtonDisabledClass;
		block.srcCode = await new CodeInjector(this.app, this.settings, language).injectCode(srcCode);

		if (language === "js") {
			block.srcCode = addMagicToJS(block.srcCode);
			this.runCode(this.settings.nodePath, this.settings.nodeArgs, this.settings.jsFileExtension, block);
		} else if (language === "java") {
			this.runCode(this.settings.javaPath, this.settings.javaArgs, this.settings.javaFileExtension, block);
		} else if (language === "python") {
			if (this.settings.pythonEmbedPlots)	// embed plots into html which shows them in the note
				block.srcCode = addInlinePlotsToPython(block.srcCode, TOGGLE_HTML_SIGIL);
			block.srcCode = addMagicToPython(block.srcCode);
			this.runCode(this.settings.pythonPath, this.settings.pythonArgs, this.settings.pythonFileExtension, block);
		} else if (language === "shell") {
			this.runCodeInShell(this.settings.shellPath, this.settings.shellArgs, this.settings.shellFileExtension, block);
		} else if (language === "batch") {
			this.runCodeInShell(this.settings.batchPath, this.settings.batchArgs, this.settings.batchFileExtension, block);
		} else if (language === "powershell") {
			this.runCodeInShell(this.settings.powershellPath, this.settings.powershellArgs, this.settings.powershellFileExtension, block);
		} else if (language === "cpp") {
			this.runCode(this.settings.clingPath, `-std=${this.settings.clingStd} ${this.settings.clingArgs}`, this.settings.cppFileExtension, block);
		} else if (language === "prolog") {
			this.runCode("", "", "", block);
			button.className = runButtonClass;
		} else if (language === "groovy") {
			this.runCodeInShell(this.settings.groovyPath, this.settings.groovyArgs, this.settings.groovyFileExtension, block);
		} else if (language === "rust") {
			this.runCode(this.settings.cargoPath, "eval" + this.settings.cargoEvalArgs, this.settings.rustFileExtension, block);
		} else if (language === "r") {
			block.srcCode = addInlinePlotsToR(block.srcCode);
			this.runCode(this.settings.RPath, this.settings.RArgs, this.settings.RFileExtension, block);
		} else if (language === "go") {
			this.runCode(this.settings.golangPath, this.settings.golangArgs, this.settings.golangFileExtension, block);
		} else if (language === "kotlin") {
			this.runCodeInShell(this.settings.kotlinPath, this.settings.kotlinArgs, this.settings.kotlinFileExtension, block);
		} else if (language === "ts") {
			this.runCodeInShell(this.settings.tsPath, this.settings.tsArgs, "ts", block);
		} else if (language === "lua") {
			this.runCodeInShell(this.settings.luaPath, this.settings.luaArgs, this.settings.luaFileExtension, block);
		} else if (language === "dart") {
			this.runCodeInShell(this.settings.dartPath, this.settings.dartArgs, this.settings.dartFileExtension, block);
		} else if (language === "cs") {
			this.runCodeInShell(this.settings.csPath, this.settings.csArgs, this.settings.csFileExtension, block);
		} else if (language === "haskell") {
			this.runCodeInShell(this.settings.useGhci ? this.settings.ghciPath : this.settings.runghcPath, this.settings.useGhci ? "" : "-f " + this.settings.ghcPath, "hs", block);
		} else if (language === "mathematica") {
			this.runCodeInShell(this.settings.mathematicaPath, this.settings.mathematicaArgs, this.settings.mathematicaFileExtension, block);
		} else if (language === "scala") {
			this.runCodeInShell(this.settings.scalaPath, this.settings.scalaArgs, this.settings.scalaFileExtension, block);
		} else if (language === "swift") {
			this.runCodeInShell(this.settings.swiftPath, this.settings.swiftArgs, this.settings.swiftFileExtension, block);
		} else if (language === "c") {
			this.runCodeInShell(this.settings.clingPath, this.settings.clingArgs, "c", block);
		} else if (language === "ruby") {
			this.runCodeInShell(this.settings.rubyPath, this.settings.rubyArgs, this.settings.rubyFileExtension, block);
		} else if (language === "sql") {
			this.runCodeInShell(this.settings.sqlPath, this.settings.sqlArgs, "sql", block);
		} else if (language === "octave") {
			block.srcCode = addInlinePlotsToOctave(block.srcCode);
			this.runCodeInShell(this.settings.octavePath, this.settings.octaveArgs, this.settings.octaveFileExtension, block);
		} else if (language === "maxima") {
			block.srcCode = addInlinePlotsToMaxima(block.srcCode);
			this.runCodeInShell(this.settings.maximaPath, this.settings.maximaArgs, this.settings.maximaFileExtension, block);
		} else if (language === "racket") {
			this.runCodeInShell(this.settings.racketPath, this.settings.racketArgs, this.settings.racketFileExtension, block);
		} else if (language === "applescript") {
			this.runCodeInShell(this.settings.applescriptPath, this.settings.applescriptArgs, this.settings.applescriptFileExtension, block);
		} else if (language === "zig") {
			this.runCodeInShell(this.settings.zigPath, this.settings.zigArgs, "zig", block);
		} else if (language === "ocaml") {
			this.runCodeInShell(this.settings.ocamlPath, this.settings.ocamlArgs, "ocaml", block);
		} else if (language === "php") {
			this.runCodeInShell(this.settings.phpPath, this.settings.phpArgs, this.settings.phpFileExtension, block);
		} else if (language === "latex") {
			block.srcCode = modifyLatexCode(block.srcCode, this.settings);
			const outputPath = await retrieveFigurePath(block.srcCode, this.settings.latexFigureTitlePattern, block.markdownFile, this.settings);
			if (!this.settings.latexDoFilter) {
				this.runCode(this.settings.latexCompilerPath, this.settings.latexCompilerArgs, outputPath, block);
			} else {
				this.runCode(this.settings.latexTexfotPath, [this.settings.latexTexfotArgs, this.settings.latexCompilerPath, this.settings.latexCompilerArgs].join(" "), outputPath, block);
			}
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
	 * @param cmd The command that should be used to execute the code. (e.g. python, java, ...)
	 * @param cmdArgs Additional arguments that should be passed to the command.
	 * @param ext The file extension of the temporary file. Should correspond to the language of the code. (e.g. py, ...)
	 * @param block Contains context needed for execution including source code, output handler, and UI elements
	 */
	private runCode(cmd: string, cmdArgs: string, ext: string, block: CodeBlockContext) {
		const outputter: Outputter = block.outputter;

		outputter.startBlock();
		const executor = this.executors.getExecutorFor(block.markdownFile, block.language, false);
		executor.run(block.srcCode, outputter, cmd, cmdArgs, ext).then(() => {
			block.button.className = runButtonClass;
			outputter.closeInput();
			outputter.finishBlock();
		});
	}

	/**
	 * Executes the code with the given command and arguments. The code is written to a temporary file and then executed.
	 * This is equal to {@link runCode} but the code is executed in a shell. This is necessary for some languages like groovy.
	 * @param cmd The command that should be used to execute the code. (e.g. python, java, ...)
	 * @param cmdArgs Additional arguments that should be passed to the command.
	 * @param ext The file extension of the temporary file. Should correspond to the language of the code. (e.g. py, ...)
	 * @param block Contains context needed for execution including source code, output handler, and UI elements
	 */
	private runCodeInShell(cmd: string, cmdArgs: string, ext: string, block: CodeBlockContext) {
		const executor = this.executors.getExecutorFor(block.markdownFile, block.language, true);
		executor.run(block.srcCode, block.outputter, cmd, cmdArgs, ext).then(() => {
			block.button.className = runButtonClass;
		});
	}
}
