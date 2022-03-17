import { ChildProcess } from 'child_process';
import { V4MAPPED } from 'dns';
import { App, Editor, MarkdownView, Modal, Notice, parseFrontMatterAliases, Plugin, Workspace, WorkspaceParent, WorkspaceSidedock} from 'obsidian';
import { Context, createContext, Script } from 'vm';
import * as fs from "fs";
import * as child_process from "child_process";


const supportedLanguages = ["js"];
const vmContextOptions = {
	filename: 'obsidian-note.js', // filename for stack traces
	lineOffset: 1, // line number offset to be used for stack traces
	columnOffset: 1, // column number offset to be used for stack traces
	displayErrors: true,
	timeout: 1000, // ms
	require: require,
	console: console
}

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
					button.addEventListener("click", () => this.runJavaScript(codeBlock.innerText));
				}
			})
	}

	runJavaScript2(codeBlockContent: string) {
		new Notice("Running...")

		const sandbox = {__history__: new Array<string>()};
		const newCons = "var console = {};console.log=(x)=>__history__.push(x);"

		try {
			const script = new Script(newCons + codeBlockContent);
			script.runInNewContext(sandbox, vmContextOptions);

		} catch(err) {
			sandbox.__history__.push(err.toString());
			console.log(err);
		}

		console.log(sandbox);
		sandbox.__history__.forEach(x => console.log(x + "\n"));
	}

	runJavaScript(codeBlockContent: string) {
		new Notice("Running...");
		let tempFileName = 'temp_' + Date.now() + '.js';

		fs.writeFile(tempFileName, codeBlockContent, (err => {
			if(err) {
				console.log("Something gone wrong.\n" + err)
				return;
			}

			child_process.execFile("node",  [tempFileName], (err, stdout, stderr) => {
				if(err) {
					console.log("Something gone wrong.\n" + err)
					return;
				}

				console.log(stdout);
				console.log(stderr);
			})
		}));
	}
}
