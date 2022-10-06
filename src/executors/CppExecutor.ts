import {ExecutorSettings} from "src/settings/Settings";
import NonInteractiveCodeExecutor from './NonInteractiveCodeExecutor';
import type {ChildProcessWithoutNullStreams} from "child_process";
import type {Outputter} from "src/Outputter";

export default class CppExecutor extends NonInteractiveCodeExecutor {
	clingStd: string;
	clingArgs: string;
	clingPath: string;

	constructor(settings: ExecutorSettings, file: string) {
		super(false, file, "cpp");
		this.clingStd = settings.clingStd;
		this.clingArgs = settings.clingArgs;
		this.clingPath = settings.clingPath;
	}

	override async run(codeBlockContent: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string) {
		const extension = "cpp";
		const args = `-std=${this.clingStd} ${this.clingArgs}`;
		// Generate a new temp file id and don't set to undefined to super.run() uses the same file id
		this.getTempFile(extension);
		// Cling expects the main function to have the same name as the file
		const code = codeBlockContent.replace(/main\(\)/g, `temp_${this.tempFileId}()`);
		super.run(code, outputter, this.clingPath, args, extension);
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
