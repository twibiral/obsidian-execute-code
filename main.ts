import { ChildProcess } from 'child_process';
import { V4MAPPED } from 'dns';
import { App, Editor, MarkdownView, Modal, Notice, parseFrontMatterAliases, Plugin, Workspace, WorkspaceParent, WorkspaceSidedock} from 'obsidian';
import { Context, createContext, Script } from 'vm';
import * as fs from "fs";
import * as child_process from "child_process";


const supportedLanguages = ["js"];

const buttonText = "Run";

const runButtonClass = "run-code-button";
const hasButtonClass = "has-run-code-button";

export default class ExecuteCodePlugin extends Plugin {
	async onload() {
		console.log("loading plugin: Execute Code");

		this.injectButtons();
		this.registerInterval(window.setInterval(this.injectButtons.bind(this), 2000));
	}

	onunload() {
		document
			.querySelectorAll("pre > code")
			.forEach((codeBlock: HTMLElement) => {
				const pre = codeBlock.parentElement as HTMLPreElement;
				const parent = pre.parentElement as HTMLDivElement;

				if(parent.hasClass(hasButtonClass)){
					// remove existing button
					parent.removeClass(hasButtonClass);
				}
			});

		document
			.querySelectorAll("pre button")
			.forEach((button: HTMLButtonElement) => {		
				if(button.classList.contains(runButtonClass)) {
					button.remove();
				}
			})

		console.log("unloaded plugin: Execute Code");
	}

	injectButtons() {
		this.addRunButtons();
	}

	addRunButtons() {
		document
			.querySelectorAll("pre > code")
			.forEach((codeBlock: HTMLElement) => {
				const pre = codeBlock.parentElement as HTMLPreElement;
				const parent = pre.parentElement as HTMLDivElement;
				const language = pre.className.toLowerCase();

				if(! supportedLanguages.some(
					(lang) =>pre.classList.contains(`language-${lang}`)
				)) {
					// Unsupported language
					return 0;
				}

				if(parent.hasClass(hasButtonClass)){
					// Already has a button
					return 0;
				}

				// Add button:
				if(language.contains("language-js")) {
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
		new Notice("Running with child process...");
		const tempFileName = 'temp_' + Date.now() + '.js';

		fs.writeFile(tempFileName, codeBlockContent, (err => {
			if(err) {
				console.log("Something gone wrong while writing to file.\n" + err)
				return;
			}

			child_process.execFile("node",  [tempFileName], (err, stdout, stderr) => {
				if(err) {
					console.log("Something gone wrong while executing.\n" + err)
					// return;
				}

				console.log("To stdout: " + stdout);
				console.log("To stderr: " + stderr);

				outputter.clear();
				outputter.write(stdout);
				if(stderr) {
					const splitted = stderr.split("\n");
					outputter.write(splitted[0] + "\n" + splitted[1]);
				}
			})
		}));

		fs.rm(tempFileName, (err => {
			if(err){
				console.log("Couldn't delete file! \n" + err)
			}
		}))
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
		if(this.outputElement) {
			console.log("Delete")
		}
	}

	write(text: string) {
		if(! this.outputElement) {
			const parentEl = this.codeBlockElement.parentElement as HTMLDivElement;
			
			this.outputElement = document.createElement("code");
			this.outputElement.addClass("language-output");

			parentEl.appendChild(this.outputElement);
			
			// add clear button:
			const button = document.createElement("button");
			button.className = "clear-button";
			button.setText("Clear");
			button.addEventListener("click", () => this.delete());

			parentEl.appendChild(button);
		}

		this.outputElement.innerText += text + "\n";
	}
}