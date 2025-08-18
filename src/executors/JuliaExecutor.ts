import {ChildProcessWithoutNullStreams} from "child_process";
import {ExecutorSettings} from "src/settings/Settings";
import ReplExecutor from "./ReplExecutor.js";


export default class JuliaExecutor extends ReplExecutor {

	process: ChildProcessWithoutNullStreams

	constructor(settings: ExecutorSettings, file: string) {
		const args = settings.juliaArgs ? settings.juliaArgs.split(" ") : [];

		//args.unshift(`--interactive`);

		super(settings, settings.juliaPath, args, file, "julia");
	}

	/**
	 * Writes a single newline to ensure that the stdin is set up correctly.
	 */
	async setup() {
		this.process.stdin.write("\n");
	}

	wrapCode(code: string, finishSigil: string): string {
	
		//apparently some issue with Meta.parse: https://github.com/JuliaInterop/JuliaCall/issues/197
		//return `try \n eval(Meta.parse(${JSON.stringify(code)}))\n catch err; \n bt = catch_backtrace(); msg = sprint(showerror, err, bt); println(stderr,msg) \n finally \n print(${JSON.stringify(finishSigil)}) \n end\n`
		// this works and will return an error if there is one, just not on stderr
		return `${code} \n print(${JSON.stringify(finishSigil)}) \n`
	}
	
	removePrompts(output: string, source: "stdout" | "stderr"): string {
		return output;
	}

}
