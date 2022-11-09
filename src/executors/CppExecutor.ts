import type { Outputter } from "src/Outputter";
import type { ExecutorSettings } from "src/settings/Settings";
import ClingExecutor from './ClingExecutor';

export default class CppExecutor extends ClingExecutor {

	constructor(settings: ExecutorSettings, file: string) {
		super(settings, file, "cpp");
	}
}
