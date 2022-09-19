import {FileSystemAdapter, MarkdownRenderer, MarkdownView, Notice, Plugin} from 'obsidian';
import * as fs from "fs";
import * as os from "os"
import * as child_process from "child_process";
import {Outputter} from "./Outputter";
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

const supportedLanguages = ["js", "javascript", "python", "cpp", "prolog", "shell", "bash", "groovy", "r", "go", "rust",
	"java", "powershell", "kotlin"];
const languagePrefixes = ['run', 'pre', 'post'];

const buttonText = "Run";

const runButtonClass = "run-code-button";
const runButtonDisabledClass = "run-button-disabled";
const hasButtonClass = "has-run-code-button";
const codeParentClass = 'code-parent';

const DEFAULT_SETTINGS: ExecutorSettings = {
	timeout: 10000,
	nodePath: "node",
	nodeArgs: "",
	pythonPath: "python",
	pythonArgs: "",
	pythonEmbedPlots: true,
	shellPath: "bash",
	shellArgs: "",
	shellFileExtension: "sh",
	groovyPath: "groovy",
	groovyArgs: "",
	groovyFileExtension: "groovy",
	golangPath: "go",
	golangArgs: "run",
	golangFileExtension: "go",
	javaPath: "java",
	javaArgs: "-ea",
	javaFileExtension: "java",
	maxPrologAnswers: 15,
	powershellPath: "powershell",
	powershellArgs: "-file",
	powershellFileExtension: "ps1",
	cargoPath: "cargo",
	cargoArgs: "run",
	cppRunner: "cling",
	cppInject: "", // TODO group this with all other languages
	clingPath: "cling",
	clingArgs: "",
	clingStd: "c++17",
	rustFileExtension: "rs",
	RPath: "Rscript",
	RArgs: "",
	REmbedPlots: true,
	kotlinPath: "kotlinc",
	kotlinArgs: "-script",
	kotlinFileExtension: "kts",
}

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
					await MarkdownRenderer.renderMarkdown('```' + l + '\n' + src + '\n```', el, '', null)
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

	private getSrcCode(codeBlock: HTMLElement) {
		let srcCode = codeBlock.getText();	// get source code and perform magic to insert title etc
		const vars = this.getVaultVariables();
		if (vars) {
			srcCode = insertVaultPath(srcCode, vars.vaultPath);
			srcCode = insertNotePath(srcCode, vars.filePath);
			srcCode = insertNoteTitle(srcCode, vars.fileName);
		} else {
			console.warn(`Could not load all Vault variables! ${vars}`)
		}
		return srcCode;
	}

	// TODO make sure this works with side-by-side documents
	// TODO make sure this works in preview mode i.e. with the run- prefix

	// TODO get this working for run blocks as well


	// !
	// TODO looks like divs that aren't in view are deleted, this is a pretty big issue
	// TODO have to fix this somehow...
	// !


	// TODO might have to be async here, make all the run code async
	private async injectCode(codeBlock: HTMLElement, srcCode: string, language: string) {
		let prependSrcCode = '';
		let appendSrcCode = '';

		// console.log(this.app.workspace.activeLeaf.view.containerEl);

		// const a = new MarkdownPreviewView(this.app.workspace.activeLeaf.view.containerEl);
		// a.rerender()


		// console.log('active leaf display text')
		// const activeFile = this.app.workspace.getActiveFile();
		// const fileContents = await this.app.vault.read(activeFile);
		// const renderedMdEle = document.createElement("tmp-codeblock-page-rendered-md");
		// await MarkdownRenderer.renderMarkdown(fileContents, renderedMdEle, activeFile.path, this);
		// console.log(renderedMdEle);
		// renderedMdEle.remove();

		// console.log(fileContents);

		// TODO do a query selector all on the code blocks and look for only those with the class language-${language}

		const pageElement = codeBlock.parentElement.parentElement.parentElement;
		const preClassName = `${codeParentClass}-language-pre-${language}`;
		const postClassName = `${codeParentClass}-language-post-${language}`;


		for (const ele of Array.from(pageElement.children)) {
			// Don't prepend self or anything below self code block
			if (ele === codeBlock.parentElement.parentElement)
				break;
			console.log('classnames: ');
			console.log(ele.className);
			// Only check pre and post blocks
			if (!ele.className.contains(preClassName) && !ele.className.contains(postClassName))
				continue;
			ele.children[0].children[0].querySelectorAll("code") // Get all code elements in pre element
				.forEach((injectCodeBlock: HTMLElement) => {
					// Ignore non-source code blocks e.g. language-output
					if (!injectCodeBlock.className.contains(`language-${language}`))
						return;
					// Pre-block
					if (ele.hasClass(preClassName))
						prependSrcCode += this.getSrcCode(injectCodeBlock);
					// Post-block
					else if (ele.hasClass(postClassName))
						{appendSrcCode += this.getSrcCode(injectCodeBlock);	console.log('new append code:'); console.log(appendSrcCode);}
				})
		}
		// TODO add global inject here
		srcCode = `${prependSrcCode}\n${srcCode}\n${appendSrcCode}`;
		console.log('source code:');
		console.log(srcCode);
		return srcCode;
	}

	private addRunButtons(element: HTMLElement) {
		element.querySelectorAll("code")
			.forEach((codeBlock: HTMLElement) => {
				const language = codeBlock.className.toLowerCase();
				if (!language || !language.contains("language-"))
					return;

				const pre = codeBlock.parentElement as HTMLPreElement;
				const parent = pre.parentElement as HTMLDivElement;

				const srcCode = this.getSrcCode(codeBlock);

				// Set up enumeration over all code blocks for injection later when running code
				const languageClassName = /language-([^\s]+)/.exec(language)[0];
				const className = `${codeParentClass}-${languageClassName}`;
				if (!parent.hasClass(className))
					parent.addClass(className); // Element gets reconstructed on language change, no need to remove previous classes

				// TODO doesn't look like clear button being added to the outputs?

				// TODO If don't have main function and requires main function, pressing run put the entire code block in a main function

				if (supportedLanguages.some((lang) => language.contains(`language-${lang}`))
					&& !parent.classList.contains(hasButtonClass)) { // unsupported language
					const out = new Outputter(codeBlock);
					parent.classList.add(hasButtonClass);
					const button = this.createRunButton();
					pre.appendChild(button);
					this.addListenerToButton(language, srcCode, codeBlock, button, out);
				}
			});
	}

	private addListenerToButton(language: string, srcCode: string, codeBlock: HTMLElement, button: HTMLButtonElement, out: Outputter) {
		if (language.contains("language-js") || language.contains("language-javascript")) {
			srcCode = addMagicToJS(srcCode);

			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				this.runCode(await this.injectCode(codeBlock, srcCode, "js"), out, button, this.settings.nodePath, this.settings.nodeArgs, "js");
			});

		} else if (language.contains("java")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				this.runCode(await this.injectCode(codeBlock, srcCode, "java"), out, button, this.settings.javaPath, this.settings.javaArgs, this.settings.javaFileExtension);
			});

		} else if (language.contains("language-python")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				if (this.settings.pythonEmbedPlots)	// embed plots into html which shows them in the note
					srcCode = addInlinePlotsToPython(srcCode);

				srcCode = addMagicToPython(srcCode);

				this.runCode(await this.injectCode(codeBlock, srcCode, "python"), out, button, this.settings.pythonPath, this.settings.pythonArgs, "py");
			});

		} else if (language.contains("language-shell") || language.contains("language-bash")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				this.runCode(srcCode, out, button, this.settings.shellPath, this.settings.shellArgs, this.settings.shellFileExtension);
			});

		} else if (language.contains("language-powershell")) {
			button.addEventListener("click",async  () => {
				button.className = runButtonDisabledClass;
				this.runCode(srcCode, out, button, this.settings.powershellPath, this.settings.powershellArgs, this.settings.powershellFileExtension);
			});

		} else if (language.contains("language-cpp")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				out.clear();
				const cppCode = `${this.settings.cppInject}\n${srcCode}`; // TODO move this logic into prependcode
				this.runCode(await this.injectCode(codeBlock, srcCode, "cpp"), out, button, this.settings.clingPath, `-std=${this.settings.clingStd} ${this.settings.clingArgs}`, "cpp");
				button.className = runButtonClass;
			})

		} else if (language.contains("language-prolog")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				out.clear();

				const prologCode = srcCode.split(/\n+%+\s*query\n+/);
				if (prologCode.length < 2) return;	// no query found

				this.runPrologCode(prologCode, out);

				button.className = runButtonClass;
			})

		} else if (language.contains("language-groovy")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				this.runCodeInShell(await this.injectCode(codeBlock, srcCode, "groovy"), out, button, this.settings.groovyPath, this.settings.groovyArgs, this.settings.groovyFileExtension);
			});

		} else if (language.contains("language-rust")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				this.runCode(await this.injectCode(codeBlock, srcCode, "rust"), out, button, this.settings.cargoPath, this.settings.cargoArgs, this.settings.rustFileExtension);
			});

		} else if (language.contains("language-r")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				srcCode = addInlinePlotsToR(srcCode);
				console.log(srcCode);

				this.runCode(await this.injectCode(codeBlock, srcCode, "r"), out, button, this.settings.RPath, this.settings.RArgs, "R");
			});
		} else if (language.contains("language-go")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;

				this.runCode(await this.injectCode(codeBlock, srcCode, "go"), out, button, this.settings.golangPath, this.settings.golangArgs, this.settings.golangFileExtension);
			});
		} else if (language.contains("language-kotlin")) {
			button.addEventListener("click", async () => {
				button.className = runButtonDisabledClass;
				this.runCodeInShell(await this.injectCode(codeBlock, srcCode, "kotlin"), out, button, this.settings.kotlinPath, this.settings.kotlinArgs, this.settings.kotlinFileExtension);
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
