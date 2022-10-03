import {FileSystemAdapter, FileView, MarkdownRenderer, MarkdownView, Notice, Plugin} from 'obsidian';
import * as fs from "fs";
import * as os from "os"
import * as child_process from "child_process";

import {Outputter} from "./Outputter";
import type {ExecutorSettings} from "./Settings";
import {DEFAULT_SETTINGS} from "./Settings";
import {SettingsTab} from "./SettingsTab";
import {CodeInjector, getLanguageAlias} from './TransformCode';
import {addInlinePlotsToPython, addInlinePlotsToR, addMagicToJS, addMagicToPython,} from "./Magic";

// @ts-ignore
import * as prolog from "tau-prolog";
import NonInteractiveCodeExecutor from './executors/NonInteractiveCodeExecutor';
import ExecutorContainer from './ExecutorContainer';
import ExecutorManagerView, { EXECUTOR_MANAGER_OPEN_VIEW_COMMAND_ID, EXECUTOR_MANAGER_VIEW_ID } from './ExecutorManagerView';


const languageAliases = ["javascript", "typescript", "bash", "csharp", "wolfram", "nb", "wl"] as const;
const cannonicalLanguages = ["js", "ts", "cs", "lua", "python", "cpp",
	"prolog", "shell", "groovy", "r", "go", "rust", "java", "powershell", "kotlin", "mathematica"] as const;
const supportedLanguages = [...languageAliases, ...cannonicalLanguages] as const;


type SupportedLanguage = typeof supportedLanguages[number];
export type LanguageId = typeof cannonicalLanguages[number];

const buttonText = "Run";

const runButtonClass = "run-code-button";
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
			
		for(const executor of this.executors) {
			executor.stop();
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
				const language = codeBlock.className.toLowerCase();
				if (!language || !language.contains("language-"))
					return;

				const pre = codeBlock.parentElement as HTMLPreElement;
				const parent = pre.parentElement as HTMLDivElement;

				const srcCode = codeBlock.getText();
				
				const cannonicalLanguage = getLanguageAlias(
					supportedLanguages.find((lang => language.contains(`language-${lang}`)))
				) as LanguageId;

				if (cannonicalLanguage // if the language is supported 
					&& !parent.classList.contains(hasButtonClass)) { // & this block hasn't been buttonified already
					const out = new Outputter(codeBlock, this.settings.allowInput);
					parent.classList.add(hasButtonClass);
					const button = this.createRunButton();
					pre.appendChild(button);
					this.addListenerToButton(cannonicalLanguage, srcCode, button, out, file);
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
		if (language == "js") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				let transformedCode = await new CodeInjector(this.app, this.settings, "js").injectCode(srcCode);
				transformedCode = addMagicToJS(transformedCode);
				this.runCode(transformedCode, out, button, this.settings.nodePath, this.settings.nodeArgs, "js", language, file);
			});

		} else if (language == "java") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				const transformedCode = await new CodeInjector(this.app, this.settings, "java").injectCode(srcCode);
				this.runCode(transformedCode, out, button, this.settings.javaPath, this.settings.javaArgs, this.settings.javaFileExtension, language, file);
			});

		} else if (language == "python") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				let transformedCode = await new CodeInjector(this.app, this.settings, "python").injectCode(srcCode);
				if (this.settings.pythonEmbedPlots)	// embed plots into html which shows them in the note
					transformedCode = addInlinePlotsToPython(transformedCode);
				transformedCode = addMagicToPython(transformedCode);

				this.runCode(transformedCode, out, button, this.settings.pythonPath, this.settings.pythonArgs, "py", language, file);
			});

		} else if (language == "shell") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, "shell").injectCode(srcCode);
				this.runCodeInShell(transformedCode, out, button, this.settings.shellPath, this.settings.shellArgs, this.settings.shellFileExtension, language, file);				
			});

		} else if (language == "powershell") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, "powershell").injectCode(srcCode);
				this.runCodeInShell(transformedCode, out, button, this.settings.powershellPath, this.settings.powershellArgs, this.settings.powershellFileExtension, language, file);
			});

		} else if (language == "cpp") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				out.clear();
				const transformedCode = await new CodeInjector(this.app, this.settings, "cpp").injectCode(srcCode);
				this.runCode(transformedCode, out, button, this.settings.clingPath, `-std=${this.settings.clingStd} ${this.settings.clingArgs}`, "cpp", language, file);
				button.className = runButtonClass;
			});

		} else if (language == "prolog") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				out.clear();

				const prologCode = (await new CodeInjector(this.app, this.settings, "prolog").injectCode(srcCode)).split(/\n+%+\s*query\n+/);
				if (prologCode.length < 2) return;	// no query found

				this.runPrologCode(prologCode[0], prologCode[1], out);

				button.className = runButtonClass;
			});

		} else if (language == "groovy") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				const transformedCode = await new CodeInjector(this.app, this.settings, "groovy").injectCode(srcCode);
				this.runCodeInShell(transformedCode, out, button, this.settings.groovyPath, this.settings.groovyArgs, this.settings.groovyFileExtension, language, file);
			});

		} else if (language == "rust") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				const transformedCode = await new CodeInjector(this.app, this.settings, "rust").injectCode(srcCode);
				this.runCode(transformedCode, out, button, this.settings.cargoPath, this.settings.cargoArgs, this.settings.rustFileExtension, language, file);
			});

		} else if (language == "r") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				let transformedCode = await new CodeInjector(this.app, this.settings, "r").injectCode(srcCode);
				transformedCode = addInlinePlotsToR(transformedCode);


				this.runCode(transformedCode, out, button, this.settings.RPath, this.settings.RArgs, "R", language, file);
			});

		} else if (language == "go") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, "go").injectCode(srcCode);
				this.runCode(transformedCode, out, button, this.settings.golangPath, this.settings.golangArgs, this.settings.golangFileExtension, language, file);
			});

		} else if (language == "kotlin") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, "kotlin").injectCode(srcCode);
				this.runCodeInShell(transformedCode, out, button, this.settings.kotlinPath, this.settings.kotlinArgs, this.settings.kotlinFileExtension, language, file);
			});
		} else if (language == "ts") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, "ts").injectCode(srcCode);
				this.runCodeInShell(transformedCode, out, button, this.settings.tsPath, this.settings.tsArgs, "ts", language, file);
			});
		} else if (language == "lua") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, "lua").injectCode(srcCode);
				this.runCodeInShell(transformedCode, out, button, this.settings.luaPath, this.settings.luaArgs, "lua", language, file);
			});
		} else if (language == "cs") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, "cs").injectCode(srcCode);
				this.runCodeInShell(transformedCode, out, button, this.settings.csPath, this.settings.csArgs, "csx", language, file);
			});
			// "wolfram", "mathematica", "nb", "wl"
		} else if (language == "mathematica") {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await new CodeInjector(this.app, this.settings, "mathematica").injectCode(srcCode);
				console.log(`runCodeInShell ${this.settings.mathematicaPath} ${this.settings.mathematicaArgs} ${"mathematica"}`)
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
	 * Creates a new unique file name for the given file extension. The file path is set to the temp path of the os.
	 * The file name is the current timestamp: '/{temp_dir}/temp_{timestamp}.{file_extension}'
	 *
	 * @param ext The file extension. Should correspond to the language of the code.
	 * @returns [string, number] The file path and the file name without extension.
	 */
	private getTempFile(ext: string): [string, number] {
		const now = Date.now();
		return [`${os.tmpdir()}/temp_${now}.${ext}`, now];
	}

	/**
	 * Creates new Notice that is displayed in the top right corner for a few seconds and contains an error message.
	 * Additionally, the error is logged to the console and showed in the output panel ({@link Outputter}).
	 *
	 * @param cmd The command that was executed.
	 * @param cmdArgs The arguments that were passed to the command.
	 * @param tempFileName The name of the temporary file that contained the code.
	 * @param err The error that was thrown.
	 * @param outputter The outputter that should be used to display the error.
	 * @private
	 */
	private notifyError(cmd: string, cmdArgs: string, tempFileName: string, err: any, outputter: Outputter) {
		const errorMSG = `Error while executing ${cmd} ${cmdArgs} ${tempFileName}: ${err}`
		console.error(errorMSG);
		outputter.writeErr(errorMSG);
		new Notice("Error while executing code!");
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
	 * @param language The cannonical ID of the language being ran
	 * @param file The address of the file which the code originates from
	 */
	private runCode(codeBlockContent: string, outputter: Outputter, button: HTMLButtonElement, cmd: string, cmdArgs: string, ext: string, language: LanguageId, file: string) {
		const executor = this.settings[`${language}Interactive`] 
			? this.executors.getExecutorFor(file, language)
			: new NonInteractiveCodeExecutor(false, file, language);
			
		executor.run(codeBlockContent, outputter, cmd, cmdArgs, ext).then(()=> {
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
	 * @param language The cannonical ID of the language being ran
	 * @param file The address of the file which the code originates from
	 */
	private runCodeInShell(codeBlockContent: string, outputter: Outputter, button: HTMLButtonElement, cmd: string, cmdArgs: string, ext: string, language: LanguageId, file: string) {
		const executor = this.settings[`${language}Interactive`]
			? this.executors.getExecutorFor(file, language)
			: new NonInteractiveCodeExecutor(true, file, language);
		
		executor.run(codeBlockContent, outputter, cmd, cmdArgs, ext).then(() => {
			button.className = runButtonClass;
		});
	}

	/**
	 * Executes a string with prolog code using the TauProlog interpreter.
	 * All queries must be below a line containing only '% queries'.
	 *
	 * @param facts Contains the facts.
	 * @param queries Contains the queries.
	 * @param out The {@link Outputter} that should be used to display the output of the code.
	 */
	private runPrologCode(facts: string, queries: string, out: Outputter) {
		new Notice("Running...");
		const session = prolog.create();
		session.consult(facts
			, {
				success: () => {
					session.query(queries
						, {
							success: async (goal: any) => {
								console.debug(`Prolog goal: ${goal}`)
								let answersLeft = true;
								let counter = 0;

								while (answersLeft && counter < this.settings.maxPrologAnswers) {
									await session.answer({
										success: function (answer: any) {
											new Notice("Done!");
											console.debug(`Prolog result: ${session.format_answer(answer)}`);
											out.write(session.format_answer(answer) + "\n");
										},
										fail: function () {
											/* No more answers */
											answersLeft = false;
										},
										error: function (err: any) {
											new Notice("Error!");
											console.error(err);
											answersLeft = false;
											out.writeErr(`Error while executing code: ${err}`);
										},
										limit: function () {
											answersLeft = false;
										}
									});
									counter++;
								}
							},
							error: (err: any) => {
								new Notice("Error!");
								out.writeErr("Query failed.\n")
								out.writeErr(err.toString());
							}
						}
					)
				},
				error: (err: any) => {
					out.writeErr("Adding facts failed.\n")
					out.writeErr(err.toString());
				}
			}
		);
	}

	/**
	 * Handles the output of a child process and redirects stdout and stderr to the given {@link Outputter} element.
	 * Removes the temporary file after the code execution. Creates a new Notice after the code execution.
	 *
	 * @param child The child process to handled.
	 * @param outputter The {@link Outputter} that should be used to display the output of the code.
	 * @param button The button that was clicked to execute the code. Is re-enabled after the code execution.
	 * @param fileName The name of the temporary file that was created for the code execution.
	 */
	private handleChildOutput(child: child_process.ChildProcessWithoutNullStreams, outputter: Outputter, button: HTMLButtonElement, fileName: string) {
		outputter.clear();

		child.stdout.on('data', (data) => {
			outputter.write(data.toString());
		});
		child.stderr.on('data', (data) => {
			outputter.writeErr(data.toString());
		});

		outputter.on("data", (data: string) => {
			child.stdin.write(data);
		});

		child.on('close', (code) => {
			button.className = runButtonClass;
			new Notice(code === 0 ? "Done!" : "Error!");
			
			outputter.closeInput();

			fs.promises.rm(fileName)
				.catch((err) => {
					console.error("Error in 'Obsidian Execute Code' Plugin while removing file: " + err);
					button.className = runButtonClass;
				});
		});

		child.on('error', (err) => {
			button.className = runButtonClass;
			new Notice("Error!");
			outputter.writeErr(err.toString());
		});
	}
}
