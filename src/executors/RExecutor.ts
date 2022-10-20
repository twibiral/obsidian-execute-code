import {ChildProcessWithoutNullStreams, spawn} from "child_process";
import {Outputter} from "src/Outputter";
import {ExecutorSettings} from "src/settings/Settings";
import AsyncExecutor from "./AsyncExecutor";
import ReplExecutor from "./ReplExecutor.js";


export default class RExecutor extends ReplExecutor {

	process: ChildProcessWithoutNullStreams

	constructor(settings: ExecutorSettings, file: string) {
		//use empty array for empty string, instead of [""]
		const args = settings.RArgs ? settings.RArgs.split(" ") : [];
		
		let conArgName = `notebook_connection_${Math.random().toString(16).substring(2)}`;

		args.unshift(`-e`, `${conArgName} <- file("stdin"); while(1) { eval(parse(text = readLines(${conArgName}, n=1))) }`);

		super(settings, settings.nodePath, args, file, "r");
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
		return `tryCatch({
			cat(sprintf("%s", ${code}))
		},
		error = function(e){
			cat(sprintf("%s", e), file=stderr())
		}, 
		finally = {
			cat(${JSON.stringify(finishSigil)})
		})` +
			"\n";
	}
	
	removePrompts(output: string, source: "stdout" | "stderr"): string {
		return output;
	}

}
