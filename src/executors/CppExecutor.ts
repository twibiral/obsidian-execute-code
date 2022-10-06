import NonInteractiveCodeExecutor from './NonInteractiveCodeExecutor';
import * as child_process from "child_process";
import type {ChildProcessWithoutNullStreams} from "child_process";
import type {Outputter} from "src/Outputter";
import type {ExecutorSettings} from "src/settings/Settings";

export default class CppExecutor extends NonInteractiveCodeExecutor {
	settings: ExecutorSettings

	constructor(settings: ExecutorSettings, file: string) {
		super(false, file, "cpp");
		this.settings = settings;
	}

	override async run(codeBlockContent: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string) {
		const extension = "cpp";
		const args = `-std=${this.settings.clingStd} ${this.settings.clingArgs}`;
		// Generate a new temp file id and don't set to undefined to super.run() uses the same file id
		this.getTempFile(extension);
		// Cling expects the main function to have the same name as the file
		const code = codeBlockContent.replace(/main\(\)/g, `temp_${this.tempFileId}()`);

		// Run code with a main block
		if (this.settings.cppUseMain) {
			super.run(code, outputter, this.settings.clingPath, args, extension);
			return;
		}
		// Run code without a main block
		const childArgs = [...args.split(" "), ...code.split("\n")];
		const child = child_process.spawn(this.settings.clingPath, childArgs, {env: process.env, shell: this.usesShell});
		await this.handleChildOutput(child, outputter, undefined);
	}

	override async handleChildOutput(child: ChildProcessWithoutNullStreams, outputter: Outputter, fileName: string) {		
		super.handleChildOutput(child, outputter, fileName);
		child.stdout.removeListener("data", this.stdoutCb);
		child.stderr.removeListener("data", this.stderrCb);
		const fileId = this.tempFileId;
		const replaceTmpId = (data: string) => {
			return data.replace(new RegExp(`temp_${fileId}\\(\\)`, "g"), "main()");
		}
		child.stdout.on("data", (data) => {
			this.stdoutCb(replaceTmpId(data.toString()));
		});
		child.stderr.on("data", (data) => {
			this.stderrCb(replaceTmpId(data.toString()));
		});
	}
}
