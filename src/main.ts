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
		const s: ExecutorSettings = this.settings;

		button.className = runButtonDisabledClass;
		block.srcCode = await new CodeInjector(this.app, s, language).injectCode(srcCode);

		if (language === "js") {
			this.runCode(s.nodePath, s.nodeArgs, s.jsFileExtension, block, { transform: (code) => addMagicToJS(code) });
		} else if (language === "java") {
			this.runCode(s.javaPath, s.javaArgs, s.javaFileExtension, block);
		} else if (language === "python") {
			this.runCode(s.pythonPath, s.pythonArgs, s.pythonFileExtension, block, { transform: (code) => addMagicToPython(code, s) });
		} else if (language === "shell") {
			this.runCode(s.shellPath, s.shellArgs, s.shellFileExtension, block, { shell: true });
		} else if (language === "batch") {
			this.runCode(s.batchPath, s.batchArgs, s.batchFileExtension, block, { shell: true });
		} else if (language === "powershell") {
			this.runCode(s.powershellPath, s.powershellArgs, s.powershellFileExtension, block, { shell: true });
		} else if (language === "cpp") {
			this.runCode(s.clingPath, `-std=${s.clingStd} ${s.clingArgs}`, s.cppFileExtension, block);
		} else if (language === "prolog") {
			this.runCode("", "", "", block);
			button.className = runButtonClass;
		} else if (language === "groovy") {
			this.runCode(s.groovyPath, s.groovyArgs, s.groovyFileExtension, block, { shell: true });
		} else if (language === "rust") {
			this.runCode(s.cargoPath, "eval" + s.cargoEvalArgs, s.rustFileExtension, block);
		} else if (language === "r") {
			this.runCode(s.RPath, s.RArgs, s.RFileExtension, block, { transform: (code) => addInlinePlotsToR(code) });
		} else if (language === "go") {
			this.runCode(s.golangPath, s.golangArgs, s.golangFileExtension, block);
		} else if (language === "kotlin") {
			this.runCode(s.kotlinPath, s.kotlinArgs, s.kotlinFileExtension, block, { shell: true });
		} else if (language === "ts") {
			this.runCode(s.tsPath, s.tsArgs, "ts", block, { shell: true });
		} else if (language === "lua") {
			this.runCode(s.luaPath, s.luaArgs, s.luaFileExtension, block, { shell: true });
		} else if (language === "dart") {
			this.runCode(s.dartPath, s.dartArgs, s.dartFileExtension, block, { shell: true });
		} else if (language === "cs") {
			this.runCode(s.csPath, s.csArgs, s.csFileExtension, block, { shell: true });
		} else if (language === "haskell") {
			if (s.useGhci) this.runCode(s.ghciPath, "", "hs", block, { shell: true });
			else this.runCode(s.runghcPath, "-f " + s.ghcPath, "hs", block, { shell: true });
		} else if (language === "mathematica") {
			this.runCode(s.mathematicaPath, s.mathematicaArgs, s.mathematicaFileExtension, block, { shell: true });
		} else if (language === "scala") {
			this.runCode(s.scalaPath, s.scalaArgs, s.scalaFileExtension, block, { shell: true });
		} else if (language === "swift") {
			this.runCode(s.swiftPath, s.swiftArgs, s.swiftFileExtension, block, { shell: true });
		} else if (language === "c") {
			this.runCode(s.clingPath, s.clingArgs, "c", block, { shell: true });
		} else if (language === "ruby") {
			this.runCode(s.rubyPath, s.rubyArgs, s.rubyFileExtension, block, { shell: true });
		} else if (language === "sql") {
			this.runCode(s.sqlPath, s.sqlArgs, "sql", block, { shell: true });
		} else if (language === "octave") {
			this.runCode(s.octavePath, s.octaveArgs, s.octaveFileExtension, block, { shell: true, transform: (code) => addInlinePlotsToOctave(code) });
		} else if (language === "maxima") {
			this.runCode(s.maximaPath, s.maximaArgs, s.maximaFileExtension, block, { shell: true, transform: (code) => addInlinePlotsToMaxima(code) });
		} else if (language === "racket") {
			this.runCode(s.racketPath, s.racketArgs, s.racketFileExtension, block, { shell: true });
		} else if (language === "applescript") {
			this.runCode(s.applescriptPath, s.applescriptArgs, s.applescriptFileExtension, block, { shell: true });
		} else if (language === "zig") {
			this.runCode(s.zigPath, s.zigArgs, "zig", block, { shell: true });
		} else if (language === "ocaml") {
			this.runCode(s.ocamlPath, s.ocamlArgs, "ocaml", block, { shell: true });
		} else if (language === "php") {
			this.runCode(s.phpPath, s.phpArgs, s.phpFileExtension, block, { shell: true });
		} else if (language === "latex") {
			const outputPath: string = await retrieveFigurePath(block.srcCode, s.latexFigureTitlePattern, block.markdownFile, s);
			const invokeCompiler: string = [s.latexTexfotArgs, s.latexCompilerPath, s.latexCompilerArgs].join(" ");
			if (!s.latexDoFilter) this.runCode(s.latexCompilerPath, s.latexCompilerArgs, outputPath, block, { transform: (code) => modifyLatexCode(code, s) });
			else this.runCode(s.latexTexfotPath, invokeCompiler, outputPath, block, { transform: (code) => modifyLatexCode(code, s) });
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
	private runCode(cmd: string, cmdArgs: string, ext: string, block: CodeBlockContext, options?: { shell?: boolean, transform?: (code: string) => string }) {
		const useShell: boolean = (options?.shell) ? options.shell : false;
		if (options?.transform) block.srcCode = options.transform(block.srcCode);
		if (!useShell) block.outputter.startBlock();

		const executor = this.executors.getExecutorFor(block.markdownFile, block.language, useShell);
		executor.run(block.srcCode, block.outputter, cmd, cmdArgs, ext).then(() => {
			block.button.className = runButtonClass;
			if (!useShell) {
				block.outputter.closeInput();
				block.outputter.finishBlock();
			}
		});
	}
}
