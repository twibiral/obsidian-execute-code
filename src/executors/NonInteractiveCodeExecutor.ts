import {Notice} from "obsidian";
import * as fs from "fs";
import * as child_process from "child_process";
import Executor from "./Executor";
import {Outputter} from "src/output/Outputter";
import {LanguageId} from "src/main";
import { ExecutorSettings } from "../settings/Settings.js";
import windowsPathToWsl from "../transforms/windowsPathToWsl.js";
import { error } from "console";

export default class NonInteractiveCodeExecutor extends Executor {
	usesShell: boolean
	stdoutCb: (chunk: any) => void
	stderrCb: (chunk: any) => void
	resolveRun: (value: void | PromiseLike<void>) => void | undefined = undefined;
	settings: ExecutorSettings;

	constructor(settings: ExecutorSettings, usesShell: boolean, file: string, language: LanguageId) {
		super(file, language);

		this.settings = settings;
		this.usesShell = usesShell;
	}

	stop(): Promise<void> {
		return Promise.resolve();
	}

	run(codeBlockContent: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string) {
		// Resolve any currently running blocks
		if (this.resolveRun !== undefined)
			this.resolveRun();
		this.resolveRun = undefined;

		return new Promise<void>((resolve, reject) => {
			const tempFileName = this.getTempFile(ext);

			fs.promises.writeFile(tempFileName, codeBlockContent).then(() => {
				const args = cmdArgs ? cmdArgs.split(" ") : [];

				if (this.isWSLEnabled()) {
					args.unshift("-e", cmd);
					cmd = "wsl";
					args.push(windowsPathToWsl(tempFileName));
				} else {
					args.push(tempFileName);
				}


				let child: child_process.ChildProcessWithoutNullStreams;

				// check if compiled by gcc
				if (cmd.endsWith("gcc") || cmd.endsWith("gcc.exe")) {
					// remove .c from tempFileName and add .out for the compiled output and add output path to args
					const tempFileNameWExe: string = tempFileName.slice(0, -2) + ".out";
					args.push("-o", tempFileNameWExe);

					// compile c file with gcc and handle possible output
					const childGCC = child_process.spawn(cmd, args, {env: process.env, shell: this.usesShell});
					this.handleChildOutput(childGCC, outputter, tempFileName);
					childGCC.on('exit', (code) => {
						if (code === 0) {
							// executing the compiled file
							child = child_process.spawn(tempFileNameWExe, { env: process.env, shell: this.usesShell });
							this.handleChildOutput(child, outputter, tempFileNameWExe).then(() => {
								this.tempFileId = undefined; // Reset the file id to use a new file next time
							});
						}
					});
				} else {
					child = child_process.spawn(cmd, args, { env: process.env, shell: this.usesShell });
					this.handleChildOutput(child, outputter, tempFileName).then(() => {
						this.tempFileId = undefined; // Reset the file id to use a new file next time
					});
				}				

				// We don't resolve the promise here - 'handleChildOutput' registers a listener
				// For when the child_process closes, and will resolve the promise there
				this.resolveRun = resolve;	
			}).catch((err) => {
				this.notifyError(cmd, cmdArgs, tempFileName, err, outputter);
				resolve();
			});
		});
	}

	private isWSLEnabled(): boolean {
		if (this.settings.wslMode) {
			return true;
		}

		if (this.language == 'shell' && this.settings.shellWSLMode) {
			return true;
		}

		return false;
	}

	/**
	 * Handles the output of a child process and redirects stdout and stderr to the given {@link Outputter} element.
	 * Removes the temporary file after the code execution. Creates a new Notice after the code execution.
	 *
	 * @param child The child process to handle.
	 * @param outputter The {@link Outputter} that should be used to display the output of the code.
	 * @param fileName The name of the temporary file that was created for the code execution.
	 * @returns a promise that will resolve when the child proces finishes
	 */
	protected async handleChildOutput(child: child_process.ChildProcessWithoutNullStreams, outputter: Outputter, fileName: string | undefined) {
		outputter.clear();

		// Kill process on clear
		outputter.killBlock = () => {
			// Kill the process
			child.kill('SIGINT');
		}

		this.stdoutCb = (data) => {
			outputter.write(data.toString());
		};
		this.stderrCb = (data) => {
			outputter.writeErr(data.toString());
		};

		child.stdout.on('data', this.stdoutCb);
		child.stderr.on('data', this.stderrCb);

		outputter.on("data", (data: string) => {
			child.stdin.write(data);
		});

		child.on('close', (code) => {
			if (code !== 0)
				new Notice("Error!");

			// Resolve the run promise once finished running the code block
			if (this.resolveRun !== undefined)
				this.resolveRun();

			outputter.closeInput();

			if (fileName === undefined) return;

			fs.promises.rm(fileName)
				.catch((err) => {
					console.error("Error in 'Obsidian Execute Code' Plugin while removing file: " + err);
				});
		});

		child.on('error', (err) => {
			new Notice("Error!");
			outputter.writeErr(err.toString());
		});
	}
}
