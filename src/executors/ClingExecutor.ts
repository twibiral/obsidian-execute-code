import NonInteractiveCodeExecutor from './NonInteractiveCodeExecutor';
import * as child_process from "child_process";
import type {ChildProcessWithoutNullStreams} from "child_process";
import type {Outputter} from "src/Outputter";
import type {ExecutorSettings} from "src/settings/Settings";

export default abstract class ClingExecutor extends NonInteractiveCodeExecutor {
	
	language: "cpp" | "c"

	constructor(settings: ExecutorSettings, file: string, language: "c" | "cpp") {
		super(settings, false, file, language);
	}

	override run(codeBlockContent: string, outputter: Outputter, cmd: string, args: string, ext: string) {
		
		// Run code with a main block
		if (this.settings[`${this.language}UseMain`]) {
			// Generate a new temp file id and don't set to undefined to super.run() uses the same file id
			this.getTempFile(ext);
			// Cling expects the main function to have the same name as the file
			const code = codeBlockContent.replace(/main\(\)/g, `temp_${this.tempFileId}()`);
			
			return super.run(code, outputter, this.settings.clingPath, args, ext);
		}

		// Run code without a main block
		return new Promise<void>((resolve, reject) => {
			const childArgs = [...args.split(" "), ...codeBlockContent.split("\n")];
			const child = child_process.spawn(this.settings.clingPath, childArgs, {env: process.env, shell: this.usesShell});
			// Set resolve callback to resolve the promise in the child_process.on('close', ...) listener from super.handleChildOutput
			this.resolveRun = resolve;
			this.handleChildOutput(child, outputter, this.tempFileId);
		});
	}

	/**
	 * Run parent NonInteractiveCodeExecutor handleChildOutput logic, but replace temporary main function name
	 * In all outputs from stdout and stderr callbacks, from temp_<id>() to main() to produce understandable output
	 */
	override async handleChildOutput(child: ChildProcessWithoutNullStreams, outputter: Outputter, fileName: string) {		
		super.handleChildOutput(child, outputter, fileName);
		// Remove existing stdout and stderr callbacks
		child.stdout.removeListener("data", this.stdoutCb);
		child.stderr.removeListener("data", this.stderrCb);
		const fileId = this.tempFileId;
		// Replace temp_<id>() with main()
		const replaceTmpId = (data: string) => {
			return data.replace(new RegExp(`temp_${fileId}\\(\\)`, "g"), "main()");
		}
		// Set new stdout and stderr callbacks, the same as in the parent,
		// But replacing temp_<id>() with main()
		child.stdout.on("data", (data) => {
			this.stdoutCb(replaceTmpId(data.toString()));
		});
		child.stderr.on("data", (data) => {
			this.stderrCb(replaceTmpId(data.toString()));
		});
	}
}
