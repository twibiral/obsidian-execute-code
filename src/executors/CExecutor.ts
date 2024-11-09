import type {Outputter} from "src/Outputter";
import type {ExecutorSettings} from "src/settings/Settings";
import ClingExecutor from './ClingExecutor';

export default class CExecutor extends ClingExecutor {

	constructor(settings: ExecutorSettings, file: string) {
		super(settings, file, "c");
	}

	override run(codeBlockContent: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string) {
		const install_path = this.settings[`clingPath`];
		if (install_path.endsWith("cling") || install_path.endsWith("cling.exe")) {
			return super.run(codeBlockContent, outputter, cmd, this.settings[`cArgs`], "cpp");
		} else {
			return super.run(codeBlockContent, outputter, cmd, this.settings[`cArgs`], "c");
		}
	}
}
