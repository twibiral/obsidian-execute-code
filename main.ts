import {App, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';
import * as fs from "fs";
import * as child_process from "child_process";
import {Outputter} from "./Outputter";
import {SettingsTab, ExecutorSettings} from "./SettingsTab";


const supportedLanguages = ["js", "javascript"];

const buttonText = "Run";

const runButtonClass = "run-code-button";
const runButtonDisabledClass = "run-button-disabled";
const hasButtonClass = "has-run-code-button";

const DEFAULT_SETTINGS: ExecutorSettings = {
	nodePath: "node",
	timeout: 10000
}

export default class ExecuteCodePlugin extends Plugin {
	settings: ExecutorSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));

		console.log("loading plugin: Execute Code");

		this.addRunButtons();
		this.registerMarkdownPostProcessor(this.addRunButtons);
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

		console.log("unloaded plugin: Execute Code");
	}

	addRunButtons() {
		document
			.querySelectorAll("pre > code")
			.forEach((codeBlock: HTMLElement) => {
				const pre = codeBlock.parentElement as HTMLPreElement;
				const parent = pre.parentElement as HTMLDivElement;
				const language = pre.className.toLowerCase();

				if(! supportedLanguages.some((lang) =>pre.classList.contains(`language-${lang}`))) { // unsupported language
					return 0;
				}

				if(parent.classList.contains(hasButtonClass)){ // Already has a button
					return 0;
				}

				// Add button:
				if(language.contains("language-js") || language.contains("language-javascript")) {
					parent.classList.add(hasButtonClass);
					console.log("Add run button");

					const button = document.createElement("button");
					button.classList.add(runButtonClass);
					button.setText(buttonText);

					const loadingSign = document.createElement("button");
					loadingSign.className = runButtonDisabledClass;
					loadingSign.setText("Running...");

					pre.appendChild(button);

					const out = new Outputter(codeBlock);
					button.addEventListener("click", () => {
						button.className = runButtonDisabledClass;
						this.runJavaScript(codeBlock.innerText, out, button);
					});
				}
			})
	}

	runJavaScript(codeBlockContent: string, outputter: Outputter, button: HTMLButtonElement) {
		new Notice("Running...");
		const tempFileName = 'temp_' + Date.now() + '.js';

		fs.promises.writeFile(tempFileName, codeBlockContent)
			.then(() => {
				const child = child_process.spawn(this.settings.nodePath, [tempFileName]);

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
				});
			})
			.catch((err) => {
				console.log("Error in 'Obsidian Execute Code' Plugin" + err);
			});

		fs.promises.rm(tempFileName)
			.catch((err) => {
				console.log("Error in 'Obsidian Execute Code' Plugin" + err);
			});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
