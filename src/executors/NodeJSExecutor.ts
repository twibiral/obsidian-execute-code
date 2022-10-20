import {ChildProcessWithoutNullStreams, spawn} from "child_process";
import {Outputter} from "src/output/Outputter";
import {ExecutorSettings} from "src/settings/Settings";
import AsyncExecutor from "./AsyncExecutor";
import ReplExecutor from "./ReplExecutor.js";


export default class NodeJSExecutor extends ReplExecutor {

	process: ChildProcessWithoutNullStreams

	constructor(settings: ExecutorSettings, file: string) {
		const args = settings.nodeArgs ? settings.nodeArgs.split(" ") : [];

		args.unshift(`-e`, `require("repl").start({prompt: "", preview: false, ignoreUndefined: true}).on("exit", ()=>process.exit())`);

		super(settings, settings.nodePath, args, file, "js");
	}

	/**
	 * Close the runtime.
	 * @returns A promise that resolves once the runtime is fully closed
	 */
	stop(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.process.on("close", () => {
				resolve();
			});
			this.process.kill();
			this.process = null;
		});
	}

	/**
	 * Writes a single newline to ensure that the stdin is set up correctly.
	 */
	async setup() {
		this.process.stdin.write("\n");
	}
	
	wrapCode(code: string, finishSigil: string): string {
		return `try { eval(${JSON.stringify(code)}); }` +
			`catch(e) { console.error(e); }` + 
			`finally { process.stdout.write(${JSON.stringify(finishSigil)}); }` +
			"\n";
	}
	
	removePrompts(output: string, source: "stdout" | "stderr"): string {
		return output;
	}

}
