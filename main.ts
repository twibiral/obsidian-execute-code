import {Notice, Plugin} from 'obsidian';
import * as fs from "fs";
import * as child_process from "child_process";
import {Outputter} from "./Outputter";
import {SettingsTab, ExecutorSettings} from "./SettingsTab";
// @ts-ignore
import * as JSCPP from "JSCPP";
// @ts-ignore
import * as prolog from "tau-prolog";

const supportedLanguages = ["js", "javascript", "python", "cpp", "prolog"];

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
							this.runJavaScript(codeBlock.getText(), out, button);
						});

					} else if (language.contains("language-python")) {
						button.addEventListener("click", () => {
							button.className = runButtonDisabledClass;
							this.runPython(codeBlock.getText(), out, button);
						});

					} else if (language.contains("language-cpp")) {
						button.addEventListener("click", () => {
							button.className = runButtonDisabledClass;
							out.clear();

							const cppCode = codeBlock.getText();
							const config = {
								stdio: {
									write: (s: string) => out.write(s)
								},
								unsigned_overflow: "warn", // can be "error"(default), "warn" or "ignore"
								maxTimeout: this.settings.timeout,
							};
							const exitCode = JSCPP.run(cppCode, 0, config);
							console.log("C++ exit code: " + exitCode);
							out.write("program stopped with exit code " + exitCode);
							button.className = runButtonClass;
						})

					} else if (language.contains("language-prolog")) {
						button.addEventListener("click", () => {
							button.className = runButtonDisabledClass;
							out.clear();

							const prologCode = codeBlock.getText().split(/\n+%+\s*query\n+/);
							if(prologCode.length < 2) return;

							const session = prolog.create();
							session.consult(prologCode[0]
								, {
									success: () => {
										out.write("Successfully parsed the facts.\n");
										session.query(prologCode[1]
											, {
												success: async (goal: any) => {
													console.log(goal)
													let answersLeft = true;
													let counter = 0;

													while (answersLeft) {
														await session.answer({
															success: function (answer: any) {
																console.log(session.format_answer(answer));
																out.write(session.format_answer(answer) + "\n");
															},
															fail: function () {
																/* No more answers */
																answersLeft = false;
															},
															error: function (err: any) {
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

							button.className = runButtonClass;
						})

					}
				}

			})
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

	runJavaScript(codeBlockContent: string, outputter: Outputter, button: HTMLButtonElement) {
		new Notice("Running...");
		const tempFileName = `temp_${Date.now()}.js`;
		console.log(tempFileName);

		fs.promises.writeFile(tempFileName, codeBlockContent)
			.then(() => {
				console.log(`Execute ${this.settings.nodePath} ${tempFileName}`);
				const args = this.settings.nodeArgs ? this.settings.nodeArgs.split(" ") : [];
				args.push(tempFileName);
				const child = child_process.spawn(this.settings.nodePath, args);

				this.handleChildOutput(child, outputter, button, tempFileName);
			})
			.catch((err) => {
				console.log("Error in 'Obsidian Execute Code' Plugin while executing: " + err);
			});
	}
	//
	// runMatlab(codeBlockContent: string, outputter: Outputter, button: HTMLButtonElement) {
	// 	new Notice("Running...");
	// 	const tempFileName = `temp_${Date.now()}.m`;
	//
	// 	fs.promises.writeFile(tempFileName, codeBlockContent)
	// 		.then(() => {
	// 			const child = child_process.spawn(this.settings.matlabPath,  ["-wait", "-nodesktop", "-nosplash", "-nojvm", "-nodisplay", "-minimize", "-automation", "-bash", "-r", `${codeBlockContent} \nexit;`, "> C:\\result.txt."]);
	//
	// 			this.handleChildOutput(child, outputter, button, tempFileName);
	// 		})
	// 		.catch((err) => {
	// 			console.log("Error in 'Obsidian Execute Code' Plugin while executing: " + err);
	// 		});
	// }

	runPython(codeBlockContent: string, outputter: Outputter, button: HTMLButtonElement) {
		new Notice("Running...");
		const tempFileName = `temp_${Date.now()}.py`;

		fs.promises.writeFile(tempFileName, codeBlockContent)
			.then(() => {
				const args = this.settings.pythonArgs ? this.settings.pythonArgs.split(" ") : [];
				args.push(tempFileName);
				const child = child_process.spawn("python",  args)
				this.handleChildOutput(child, outputter, button, tempFileName);
			})
			.catch((err) => {
				console.log("Error in 'Obsidian Execute Code' Plugin while executing: " + err);
			});
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
			if(code === 0) {
				new Notice("Done!");
			} else {
				new Notice("Error!");
			}

			fs.promises.rm(fileName)
				.catch((err) => {
					console.log("Error in 'Obsidian Execute Code' Plugin while removing file: " + err);
				});
		});
	}
}
