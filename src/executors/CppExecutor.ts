import type { Outputter } from "src/output/Outputter";
import type { ExecutorSettings } from "src/settings/Settings";
import ClingExecutor from './ClingExecutor';

export default class CppExecutor extends ClingExecutor {

	constructor(settings: ExecutorSettings, file: string) {
		super(settings, file, "cpp");
	}
	
	override run(codeBlockContent: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string) {
		return super.run(codeBlockContent, outputter, cmd, `-std=${this.settings.clingStd} ${cmdArgs} ${this.settings[`cppArgs`]}`, "cpp");
	}
}
