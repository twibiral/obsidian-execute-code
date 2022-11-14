import type {Outputter} from "src/Outputter";
import type {ExecutorSettings} from "src/settings/Settings";
import ClingExecutor from './ClingExecutor';

export default class CExecutor extends ClingExecutor {

	constructor(settings: ExecutorSettings, file: string) {
		super(settings, file, "c");
	}

	override run(codeBlockContent: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string) {
		return super.run(codeBlockContent, outputter, cmd, `-x c ${cmdArgs}`, "cpp");
	}
}
