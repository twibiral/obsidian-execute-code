import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';
import * as fs from "fs";
import * as child_process from "child_process";


const supportedLanguages = ["js", "javascript"];

interface ExecutorSettings {
	nodePath: string;
	timeout: number;
}

const DEFAULT_SETTINGS: ExecutorSettings = {
	nodePath: "node",
	timeout: 10000
}

const buttonText = "Run";

const runButtonClass = "run-code-button";
const hasButtonClass = "has-run-code-button";

export default class ExecuteCodePlugin extends Plugin {
	settings: ExecutorSettings;

	async onload() {
		this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));

		console.log("loading plugin: Execute Code");

		this.addRunButtons();
		this.registerInterval(window.setInterval(this.addRunButtons.bind(this), 1500));
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
					button.className = runButtonClass;
					button.setText(buttonText);

					pre.appendChild(button);

					const out = new Outputter(codeBlock);
					button.addEventListener("click", () => this.runJavaScript(codeBlock.innerText, out));
				}
			})
	}

	runJavaScript(codeBlockContent: string, outputter: Outputter) {
		new Notice("Running...");
		const tempFileName = 'temp_' + Date.now() + '.js';

		fs.writeFile(tempFileName, codeBlockContent, (err => {
			if(err) {
				console.log("Something gone wrong while writing to file.\n" + err)
				return;
			}

			child_process.execFile("node",  [tempFileName], {timeout: this.settings.timeout}, (err, stdout, stderr) => {
				if(err) {
					console.log("Something gone wrong while executing.\n" + err)
					// return;
				}

				outputter.clear();
				outputter.write(stdout);
				if(stderr) {
					const splitted = stderr.split("\n");
					outputter.writeErr(splitted[0] + "\n" + splitted[1] + "\n" + splitted[2]);
				}
			})
		}));

		fs.rm(tempFileName, (err => {
			if(err){
				console.log("Couldn't delete file! \n" + err)
			}
		}))
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class Outputter {
	codeBlockElement: HTMLElement;
	outputElement: HTMLElement;
	clearButton: HTMLButtonElement;
	textContent: string;

	constructor (codeBlock: HTMLElement) {
		this.codeBlockElement = codeBlock;
		this.textContent = "";
	}

	clear() {
		if(this.outputElement) 
			this.outputElement.innerText = "";
	}

	delete() {
		if(this.outputElement)
			this.outputElement.style.display = "none";
		
		if(this.clearButton)
			this.clearButton.style.display = "none";

		this.clear()
	}

	write(text: string) {
		if(! this.outputElement) {
			const parentEl = this.codeBlockElement.parentElement as HTMLDivElement;
			
			this.outputElement = document.createElement("code");
			this.outputElement.classList.add("language-output");

			parentEl.appendChild(this.outputElement);
		}

		if(! this.clearButton) {
			const parentEl = this.codeBlockElement.parentElement as HTMLDivElement;

			this.clearButton = document.createElement("button");
			this.clearButton.className = "clear-button";
			this.clearButton.setText("Clear");
			this.clearButton.addEventListener("click", () => this.delete());

			parentEl.appendChild(this.clearButton);
		}

		// make visible again:
		this.outputElement.style.display = "block";
		this.clearButton.style.display = "block";

		this.outputElement.innerHTML += text + "\n";
	}

	writeErr(text: string) {
		if(! this.outputElement) {
			const parentEl = this.codeBlockElement.parentElement as HTMLDivElement;
			
			this.outputElement = document.createElement("code");
			this.outputElement.classList.add("language-output");

			parentEl.appendChild(this.outputElement);
		}

		if(! this.clearButton) {
			const parentEl = this.codeBlockElement.parentElement as HTMLDivElement;

			this.clearButton = document.createElement("button");
			this.clearButton.className = "clear-button";
			this.clearButton.setText("Clear");
			this.clearButton.addEventListener("click", () => this.delete());

			parentEl.appendChild(this.clearButton);
		}

		// make visible again:
		this.outputElement.style.display = "block";
		this.clearButton.style.display = "block";

		this.outputElement.innerHTML += '<font color="red">' + text + '</font>\n';
	}
}


class SettingsTab extends PluginSettingTab {
	plugin: ExecuteCodePlugin;

	constructor(app: App, plugin: ExecuteCodePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const {containerEl} = this;
		containerEl.empty();
		
		containerEl.createEl('h2', {text: 'Settings for the Code Execution Plugin.'});
		
		new Setting(containerEl)
		.setName('Timeout (in seconds)')
		.setDesc('The time after which a program gets shut down automatically. This is to prevent infinite loops. ')
		.addText(slider => slider
			.setPlaceholder("" + this.plugin.settings.timeout/1000)
			.onChange(async (value) => {
				if( Number(value) * 1000){
					console.log('Timeout set to: ' + value);
					this.plugin.settings.timeout = Number(value) * 1000;
				}
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
			.setName('Node path')
			.setDesc('The path to your node installation.')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.nodePath)
				.setValue(this.plugin.settings.nodePath)
				.onChange(async (value) => {
					console.log('Node path set to: ' + value);
					this.plugin.settings.nodePath = value;
					// await this.plugin.saveSettings();
				}));
		}
}