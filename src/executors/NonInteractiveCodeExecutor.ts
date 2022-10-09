import {Notice} from "obsidian";
import * as fs from "fs";
import * as child_process from "child_process";
import Executor from "./Executor";
import {Outputter} from "src/Outputter";
import {LanguageId} from "src/main";

export default class NonInteractiveCodeExecutor extends Executor {
	usesShell: boolean
	stdoutCb: (chunk: any) => void
	stderrCb: (chunk: any) => void

	constructor(usesShell: boolean, file: string, language: LanguageId) {
		super(file, language);

		this.usesShell = usesShell;
	}

	stop(): Promise<void> {
		return Promise.resolve();
	}

	async run(codeBlockContent: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string) {
		new Notice("Running...");
		const tempFileName = this.getTempFile(ext);
		console.debug(`Execute ${cmd} ${cmdArgs} ${tempFileName}`);

		try {
			await fs.promises.writeFile(tempFileName, codeBlockContent);
			
			const args = cmdArgs ? cmdArgs.split(" ") : [];
			args.push(tempFileName);
			
			console.debug(`Execute ${cmd} ${args.join(" ")}`);
			const child = child_process.spawn(cmd, args, {env: process.env, shell: this.usesShell});
			
			await this.handleChildOutput(child, outputter, tempFileName);
		} catch (err) {
			this.notifyError(cmd, cmdArgs, tempFileName, err, outputter);
		}

		this.tempFileId = undefined; // Reset the file id to use a new file next time
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
			new Notice(code === 0 ? "Done!" : "Error!");

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
