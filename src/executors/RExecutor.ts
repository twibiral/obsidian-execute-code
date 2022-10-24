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
		
		let conArgName = `notebook_connection` //_${Math.random().toString(16).substring(2)}`;

		args.unshift(`-e`, `con=file("stdin", "r"); while(1) { eval(parse(text= tail(readLines(con = con, n=1)))) }`)
		
		/*`			
				try({ 
					print(
						eval(
							parse(
								text = readLines(n=4)
							)
						)
					)
				})
		`.replace(/[\r\n\s]+/g, ""));*/

		super(settings, settings.RPath, args, file, "r");
	}

	/**
	 * Writes a single newline to ensure that the stdin is set up correctly.
	 */
	async setup() {
		console.log("setup");
		//this.process.stdin.write("\n");
	}
	
	wrapCode(code: string, finishSigil: string): string {		
		return `tryCatch({
			cat(sprintf("%s", 
				eval(parse(text = ${JSON.stringify(code)} ))
			))
		},
		error = function(e){
			cat(sprintf("%s", e), file=stderr())
		}, 
		finally = {
			cat(${JSON.stringify(finishSigil)});
			flush.console()
		})`.replace(/\r?\n/g, "") +
			"\n";
	}
	
	removePrompts(output: string, source: "stdout" | "stderr"): string {
		return output;
	}

}
