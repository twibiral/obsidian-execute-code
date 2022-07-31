import {MarkdownRenderer, Notice, Plugin} from 'obsidian';
import * as fs from "fs";
import * as os from "os"
import * as child_process from "child_process";
import {Outputter} from "./Outputter";
import {ExecutorSettings, SettingsTab} from "./SettingsTab";
// @ts-ignore
import * as JSCPP from "JSCPP";
// @ts-ignore
import * as prolog from "tau-prolog";

const supportedLanguages = ["js", "javascript", "python", "cpp", "prolog", "shell", "bash", "groovy"];

const buttonText = "Run";

const runButtonClass = "run-code-button";
const runButtonDisabledClass = "run-button-disabled";
const hasButtonClass = "has-run-code-button";

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
	maxPrologAnswers: 15,
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
		supportedLanguages.forEach(l=> {
			console.log(`registering renderer for ${l}`)
			this.registerMarkdownCodeBlockProcessor(`run-${l}`, async (src, el, _ctx) => {
				await MarkdownRenderer.renderMarkdown('```' +l+ '\n' + src +'\n```' , el, '', null)
			})
		})
	}

	private addRunButtons(element: HTMLElement) {
		element.querySelectorAll("code")
			.forEach((codeBlock: HTMLElement) => {
				const pre = codeBlock.parentElement as HTMLPreElement;
				const parent = pre.parentElement as HTMLDivElement;
				const language = codeBlock.className.toLowerCase();

				if (supportedLanguages.some((lang) => language.contains(`language-${lang}`))
					&& !parent.classList.contains(hasButtonClass)) { // unsupported language

					parent.classList.add(hasButtonClass);
					const button = this.createRunButton();
					pre.appendChild(button);

					const out = new Outputter(codeBlock);

					// Add button:
					if (language.contains("language-js") || language.contains("language-javascript")) {
						button.addEventListener("click", () => {
							button.className = runButtonDisabledClass;
							this.runCode(codeBlock.getText(), out, button, this.settings.nodePath, this.settings.nodeArgs, "js");
						});

					} else if (language.contains("language-python")) {
						button.addEventListener("click", () => {
							button.className = runButtonDisabledClass;

							let codeText = codeBlock.getText();
							if (this.settings.pythonEmbedPlots) {	// embed plots into html which shows them in the note
								const showPlot = 'import io; __obsidian_execute_code_temp_pyplot_var__=io.StringIO(); plt.plot(); plt.savefig(__obsidian_execute_code_temp_pyplot_var__, format=\'svg\'); plt.close(); print(f"<div align=\\"center\\">{__obsidian_execute_code_temp_pyplot_var__.getvalue()}</div>")'
								codeText = codeText.replace(/plt\.show\(\)/g, showPlot);
							}

							this.runCode(codeText, out, button, this.settings.pythonPath, this.settings.pythonArgs, "py");
						});

					} else if (language.contains("language-shell") || language.contains("language-bash")) {
						button.addEventListener("click", () => {
							button.className = runButtonDisabledClass;
							this.runCode(codeBlock.getText(), out, button, this.settings.shellPath, this.settings.shellArgs, this.settings.shellFileExtension);
						});

					} else if (language.contains("language-cpp")) { 
						button.addEventListener("click", () => {
							button.className = runButtonDisabledClass;
							out.clear();
							this.runCpp(codeBlock.getText(), out);
							button.className = runButtonClass;
						})

					} else if (language.contains("language-prolog")) {
						button.addEventListener("click", () => {
							button.className = runButtonDisabledClass;
							out.clear();

							const prologCode = codeBlock.getText().split(/\n+%+\s*query\n+/);
							if(prologCode.length < 2) return;	// no query found

							this.runPrologCode(prologCode, out);

							button.className = runButtonClass;
						})

					} else if (language.contains("language-groovy")) {
						button.addEventListener("click", () => {
							button.className = runButtonDisabledClass;
							this.runCode(codeBlock.getText(), out, button, this.settings.groovyPath, this.settings.groovyArgs, this.settings.groovyFileExtension);
						});

					}
				}

			})
	}

	private runCpp(cppCode: string, out: Outputter) {
		new Notice("Running...");
		const config = {
			stdio: {
				write: (s: string) => out.write(s)
			},
			unsigned_overflow: "warn", // can be "error"(default), "warn" or "ignore"
			maxTimeout: this.settings.timeout,
		};
		const exitCode = JSCPP.run(cppCode, 0, config);
		console.log("C++ exit code: " + exitCode);
		out.write("\nprogram stopped with exit code " + exitCode);
		new Notice(exitCode === 0 ? "Done" : "Error");
	}

	private createRunButton() {
		console.log("Add run button");
		const button = document.createElement("button");
		button.classList.add(runButtonClass);
		button.setText(buttonText);
		return button;
	}

	onunload() {
		document
			.querySelectorAll("pre > code")
			.forEach((codeBlock: HTMLElement) => {
				const pre = codeBlock.parentElement as HTMLPreElement;
				const parent = pre.parentElement as HTMLDivElement;

				if(parent.hasClass(hasButtonClass)){
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

	private getTempFile(ext: string) {
		return `${os.tmpdir()}/temp_${Date.now()}.${ext}`
	}

	private runCode(codeBlockContent: string, outputter: Outputter, button: HTMLButtonElement, cmd: string, cmdArgs: string, ext: string) {
		new Notice("Running...");
		const tempFileName = this.getTempFile(ext)
		console.log(`${tempFileName}`);

		fs.promises.writeFile(tempFileName, codeBlockContent)
			.then(() => {
				console.log(`Execute ${this.settings.nodePath} ${tempFileName}`);
				const args = cmdArgs ? cmdArgs.split(" ") : [];

				args.push(tempFileName);

				var child = child_process.spawn(cmd, args);
				this.handleChildOutput(child, outputter, button, tempFileName);
			})
			.catch((err) => {
				console.log("Error in 'Obsidian Execute Code' Plugin while executing: " + err);
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
								console.log(goal)
								let answersLeft = true;
								let counter = 0;

								while (answersLeft && counter < this.settings.maxPrologAnswers) {
									await session.answer({
										success: function (answer: any) {
											new Notice("Done!");
											console.log(session.format_answer(answer));
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

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
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
					console.log("Error in 'Obsidian Execute Code' Plugin while removing file: " + err);
				});
		});
	}
}
