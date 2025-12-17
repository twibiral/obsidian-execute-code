import type { Outputter } from "src/output/Outputter";
import type { ExecutorSettings } from "src/settings/Settings";
import GppExecutor from './G++Executor';

export default class CppExecutor extends GppExecutor {

    constructor(settings: ExecutorSettings, file: string) {
        super(settings, file, "cpp");
    }

    override run(codeBlockContent: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string) {
        return super.run(codeBlockContent, outputter, cmd, `-std=${this.settings.gppStd} ${cmdArgs}`, "cpp");
    }
}
