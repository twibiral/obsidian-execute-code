import NonInteractiveCodeExecutor from './NonInteractiveCodeExecutor';
import type {Outputter} from "src/Outputter";
import type {ExecutorSettings} from "src/settings/Settings";

export default class FSharpExecutor extends NonInteractiveCodeExecutor {
	constructor(settings: ExecutorSettings, file: string) {
		super(settings, false, file, "fsharp");
	}

	override run(codeBlockContent: string, outputter: Outputter, cmd: string, args: string, ext: string) {
		return super.run(codeBlockContent, outputter, cmd, `fsi ${args}`, "cpp");
	}
}
