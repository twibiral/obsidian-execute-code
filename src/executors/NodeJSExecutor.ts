import {ChildProcessWithoutNullStreams, spawn} from "child_process";
import {Outputter} from "src/Outputter";
import {ExecutorSettings} from "src/settings/Settings";
import AsyncExecutor from "./AsyncExecutor";


export default class PythonExecutor extends AsyncExecutor {

	process: ChildProcessWithoutNullStreams

	constructor(settings: ExecutorSettings, file: string) {
		super(file, "js");

		const args = settings.nodeArgs ? settings.nodeArgs.split(" ") : [];

		args.unshift(`-e`, `require("repl").start()`);

		this.process = spawn(settings.nodePath, args);

		//send a newline so that the intro message won't be buffered
		this.dismissIntroMessage().then(() => {/* do nothing */});
	}

	/**
	 * Close the runtime.
	 * @returns A promise that resolves once the runtime is fully closed
	 */
	stop(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.process.kill();
			this.process.on("close", () => {
				resolve();
			});
			this.emit("close");
		});
	}

	/**
	 * Swallows and does not output the "Welcome to Node.js v..." message that shows at startup
	 */
	async dismissIntroMessage() {
		// TODO: Does the reject need to be handled? Otherwise it might be removed.
		this.addJobToQueue((resolve, reject) => {
			let stdoutBuffers = 0;
			const listener = () => {
				//we need 2 data messages: 1 for the welcome message, 1 for the prompt.
				stdoutBuffers++;
				if (stdoutBuffers >= 2) {
					this.process.stdout.removeListener("data", listener);
					resolve();
				}
			}
			this.process.stdout.on("data", listener);
		});
	}

	/**
	 * Run some NodeJS code
	 * @param code code to run
	 * @param outputter outputter to use
	 * @param cmd Not used
	 * @param cmdArgs Not used
	 * @param ext Not used
	 * @returns A promise that resolves once the code is done running
	 */
	async run(code: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string) {
		return this.addJobToQueue((resolve, reject) => {

			const trimmedCode = code.trim() + "\n";
			this.process.stdin.write(trimmedCode, () => {
				let prompts = 0;
				const requiredPrompts = Array.from(trimmedCode.matchAll(/\n/g)).length;

				outputter.clear();

				outputter.on("data", (data: string) => {
					this.process.stdin.write(data);
				});

				const writeToStderr = (data: any) => {
					outputter.writeErr(data.toString());
				};

				const writeToStdout = (data: any) => {
					const stringData = data.toString();

					//remove the prompts from the stdout stream (... on unfinished lines and > on finished lines)
					const removedPrompts = stringData.replace(/(^((\.\.\. |>) )+)|(((\.\.\.|>) )+$)/g, "")

					outputter.write(removedPrompts);

					if (stringData.endsWith("> ")) prompts++;
					if (prompts >= requiredPrompts) {
						this.process.stdout.removeListener("data", writeToStdout);
						this.process.stderr.removeListener("data", writeToStderr);
						resolve();
					}
				}

				this.process.stdout.on("data", writeToStdout);
				this.process.stderr.on("data", writeToStderr);
			});
		});
	}

}
