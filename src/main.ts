import {FileSystemAdapter, MarkdownRenderer, MarkdownView, Notice, Plugin} from 'obsidian';
import * as fs from "fs";
import * as os from "os"
import * as child_process from "child_process";
import {Outputter} from "./Outputter";
import type {ExecutorSettingsLanguages} from "./SettingsTab";
import {ExecutorSettings, SettingsTab} from "./SettingsTab";
import {
	addInlinePlotsToPython,
	addInlinePlotsToR,
	addMagicToJS,
	addMagicToPython,
	insertNotePath,
	insertNoteTitle,
	insertVaultPath
} from "./Magic";
// @ts-ignore
import * as prolog from "tau-prolog";
import {DEFAULT_SETTINGS} from "./Settings";

export const supportedLanguages = ["js", "javascript", "python", "cpp", "prolog", "shell", "bash", "groovy", "r", "go", "rust",
	"java", "powershell", "kotlin"] as const;
const languagePrefixes = ["run", "pre", "post"];

const buttonText = "Run";

const runButtonClass = "run-code-button";
const runButtonDisabledClass = "run-button-disabled";
const hasButtonClass = "has-run-code-button";

export default class ExecuteCodePlugin extends Plugin {
	settings: ExecutorSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));

		this.addRunButtons(document.body);
		this.registerMarkdownPostProcessor((element, _context) => {
			this.addRunButtons(element);
		});

		// live preview renderers
		supportedLanguages.forEach(l => {
			console.debug(`Registering renderer for ${l}.`)
			languagePrefixes.forEach(prefix => {
				this.registerMarkdownCodeBlockProcessor(`${prefix}-${l}`, async (src, el, _ctx) => {
					await MarkdownRenderer.renderMarkdown('```' + l + '\n' + src + (src.endsWith('\n') ? '' : '\n') + '```', el, '', null);
				});
			})
		})
	}

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

		console.log("Unloaded plugin: Execute Code");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// Perform magic on source code to insert title etc
	private transformCode(srcCode: string) {
		let ret = srcCode;
		const vars = this.getVaultVariables();
		if (vars) {
			ret = insertVaultPath(ret, vars.vaultPath);
			ret = insertNotePath(ret, vars.filePath);
			ret = insertNoteTitle(ret, vars.fileName);
		} else {
			console.warn(`Could not load all Vault variables! ${vars}`)
		}
		return ret;
	}

	// Transform a language name, to enable working with multiple language aliases, for example
	private transformLanguage(language: string) {
		return language
			.replace("javascript", "js")
			.replace("bash", "shell");
	}

	private async injectCode(srcCode: string, _language: ExecutorSettingsLanguages) {
		let prependSrcCode = "";
		let appendSrcCode = "";

		const language = this.transformLanguage(_language);
		const preLangName = `pre-${language}`;
		const postLangName = `post-${language}`;

		// We need to get access to all code blocks on the page so we can grab the pre / post blocks above
		// Obsidian unloads code blocks not in view, so instead we load the raw document file and traverse line-by-line
		const activeFile = this.app.workspace.getActiveFile();
		const fileContents = await this.app.vault.read(activeFile);

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
				}
				else {
					currentLanguage = this.transformLanguage(line.split("```")[1].trim().split(" ")[0]);
					// Don't check code blocks from a different language
					isLanguageEqual = /[^-]*$/.exec(language)[0] ===  /[^-]*$/.exec(currentLanguage)[0];
					insideCodeBlock = true;
				}
			}
			else if (insideCodeBlock)
				currentCode += `${line}\n`;
		}

		const realLanguage = /[^-]*$/.exec(language)[0];
		const injectedCode = `${this.settings[`${realLanguage}Inject` as keyof ExecutorSettings]}\n${prependSrcCode}\n${srcCode}\n${appendSrcCode}`;
		return this.transformCode(injectedCode);
	}

	private addRunButtons(element: HTMLElement) {
		element.querySelectorAll("code")
			.forEach((codeBlock: HTMLElement) => {
				const language = codeBlock.className.toLowerCase();
				if (!language || !language.contains("language-"))
					return;

				const pre = codeBlock.parentElement as HTMLPreElement;
				const parent = pre.parentElement as HTMLDivElement;

				const srcCode = codeBlock.getText();

				if (supportedLanguages.some((lang) => language.contains(`language-${lang}`))
					&& !parent.classList.contains(hasButtonClass)) { // unsupported language
					const out = new Outputter(codeBlock);
					parent.classList.add(hasButtonClass);
					const button = this.createRunButton();
					pre.appendChild(button);
					this.addListenerToButton(language, srcCode, button, out);
				}
			});
	}

	private addListenerToButton(language: string, srcCode: string, button: HTMLButtonElement, out: Outputter) {
		if (language.contains("language-js") || language.contains("language-javascript")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				let transformedCode = await this.injectCode(srcCode, "js");
				transformedCode = addMagicToJS(transformedCode);
				this.runCode(transformedCode, out, button, this.settings.nodePath, this.settings.nodeArgs, "js");
			});

		} else if (language.contains("java")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await this.injectCode(srcCode, "java");
				this.runCode(transformedCode, out, button, this.settings.javaPath, this.settings.javaArgs, this.settings.javaFileExtension);
			});

		} else if (language.contains("language-python")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				let transformedCode = await this.injectCode(srcCode, "python");
				if (this.settings.pythonEmbedPlots)	// embed plots into html which shows them in the note
					transformedCode = addInlinePlotsToPython(transformedCode);
				transformedCode = addMagicToPython(transformedCode);

				this.runCode(transformedCode, out, button, this.settings.pythonPath, this.settings.pythonArgs, "py");
			});

		} else if (language.contains("language-shell") || language.contains("language-bash")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await this.injectCode(srcCode, "shell");
				this.runCode(transformedCode, out, button, this.settings.shellPath, this.settings.shellArgs, this.settings.shellFileExtension);
			});

		} else if (language.contains("language-powershell")) {
			button.addEventListener("click",async  () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await this.injectCode(srcCode, "powershell");
				this.runCode(transformedCode, out, button, this.settings.powershellPath, this.settings.powershellArgs, this.settings.powershellFileExtension);
			});

		} else if (language.contains("language-cpp")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				out.clear();
				const transformedCode = await this.injectCode(srcCode, "cpp");
				this.runCode(transformedCode, out, button, this.settings.clingPath, `-std=${this.settings.clingStd} ${this.settings.clingArgs}`, "cpp");
				button.className = runButtonClass;
			});

		} else if (language.contains("language-prolog")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				out.clear();

				const prologCode = (await this.injectCode(srcCode, "prolog")).split(/\n+%+\s*query\n+/);
				if (prologCode.length < 2) return;	// no query found

				this.runPrologCode(prologCode, out);

				button.className = runButtonClass;
			});

		} else if (language.contains("language-groovy")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await this.injectCode(srcCode, "groovy");
				this.runCodeInShell(transformedCode, out, button, this.settings.groovyPath, this.settings.groovyArgs, this.settings.groovyFileExtension);
			});

		} else if (language.contains("language-rust")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await this.injectCode(srcCode, "rust");
				this.runCode(transformedCode, out, button, this.settings.cargoPath, this.settings.cargoArgs, this.settings.rustFileExtension);
			});

		} else if (language.contains("language-r")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				let transformedCode = await this.injectCode(srcCode, "r");
				transformedCode = addInlinePlotsToR(srcCode);

				this.runCode(transformedCode, out, button, this.settings.RPath, this.settings.RArgs, "R");
			});

		} else if (language.contains("language-go")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await this.injectCode(srcCode, "go");
				this.runCode(transformedCode, out, button, this.settings.golangPath, this.settings.golangArgs, this.settings.golangFileExtension);
			});

		} else if (language.contains("language-kotlin")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				const transformedCode = await this.injectCode(srcCode, "kotlin");
				this.runCodeInShell(transformedCode, out, button, this.settings.kotlinPath, this.settings.kotlinArgs, this.settings.kotlinFileExtension);
			});
		}
	}

	private getVaultVariables() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView == null) {
			return null;
		}

		const adapter = app.vault.adapter as FileSystemAdapter;
		const vaultPath = adapter.getBasePath();
		const folder = activeView.file.parent.path;
		const fileName = activeView.file.name
		const filePath = activeView.file.path

		return {
			vaultPath: vaultPath,
			folder: folder,
			fileName: fileName,
			filePath: filePath,
		}
	}

	private createRunButton() {
		console.debug("Add run button");
		const button = document.createElement("button");
		button.classList.add(runButtonClass);
		button.setText(buttonText);
		return button;
	}

	private getTempFile(ext: string): [string, number] {
		const now = Date.now();
		return [`${os.tmpdir()}/temp_${now}.${ext}`, now];
	}

	private notifyError(cmd: string, cmdArgs: string, tempFileName: string, err: any, outputter: Outputter) {
		const errorMSG = `Error while executing ${cmd} ${cmdArgs} ${tempFileName}: ${err}`
		console.error(errorMSG);
		outputter.writeErr(errorMSG);
		new Notice("Error while executing code!");
	}

	private runCode(codeBlockContent: string, outputter: Outputter, button: HTMLButtonElement, cmd: string, cmdArgs: string, ext: string) {
		new Notice("Running...");
		const [tempFileName, fileId] = this.getTempFile(ext)
		console.debug(`Execute ${cmd} ${cmdArgs} ${tempFileName}`);
		if (ext === "cpp")
			codeBlockContent = codeBlockContent.replace(/main\(\)/g, `temp_${fileId}()`);
		fs.promises.writeFile(tempFileName, codeBlockContent)
			.then(() => {
				const args = cmdArgs ? cmdArgs.split(" ") : [];
				args.push(tempFileName);

				console.debug(`Execute ${cmd} ${args.join(" ")}`);
				const child = child_process.spawn(cmd, args);

				this.handleChildOutput(child, outputter, button, tempFileName);
			})
			.catch((err) => {
				this.notifyError(cmd, cmdArgs, tempFileName, err, outputter);
				button.className = runButtonClass;
			});
	}

	private runCodeInShell(codeBlockContent: string, outputter: Outputter, button: HTMLButtonElement, cmd: string, cmdArgs: string, ext: string) {
		new Notice("Running...");
		const [tempFileName] = this.getTempFile(ext)
		console.debug(`Execute ${cmd} ${cmdArgs} ${tempFileName}`);

		fs.promises.writeFile(tempFileName, codeBlockContent)
			.then(() => {
				const args = cmdArgs ? cmdArgs.split(" ") : [];
				args.push(tempFileName);

				console.debug(`Execute ${cmd} ${args.join(" ")}`);
				const child = child_process.spawn(cmd, args, {shell: true});

				this.handleChildOutput(child, outputter, button, tempFileName);
			})
			.catch((err) => {
				this.notifyError(cmd, cmdArgs, tempFileName, err, outputter);
				button.className = runButtonClass;
			});
	}

	private runPrologCode(prologCode: string[], out: Outputter) {
		new Notice("Running...");
		const session = prolog.create();
		session.consult(prologCode[0]
			, {
				success: () => {
					session.query(prologCode[1]
						, {
							success: async (goal: any) => {
								console.debug(`Prolog goal: ${goal}`)
								let answersLeft = true;
								let counter = 0;

								while (answersLeft && counter < this.settings.maxPrologAnswers) {
									await session.answer({
										success: function (answer: any) {
											new Notice("Done!");
											console.debug(`Prolog result:${session.format_answer(answer)}`);
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

	private handleChildOutput(child: child_process.ChildProcessWithoutNullStreams, outputter: Outputter, button: HTMLButtonElement, fileName: string) {
		outputter.clear();

		child.stdout.on('data', (data) => {
			outputter.write(data.toString());
		});
		child.stderr.on('data', (data) => {
			outputter.writeErr(data.toString());
		});

		child.on('close', (code) => {
			button.className = runButtonClass;
			new Notice(code === 0 ? "Done!" : "Error!");

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
