import type { Outputter } from "src/output/Outputter";
import type { ExecutorSettings } from "src/settings/Settings";
import GppExecutor from './G++Executor';

export default class CExecutor extends GppExecutor {

    constructor(settings: ExecutorSettings, file: string) {
        super(settings, file, "c");
    }

    override run(codeBlockContent: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string) {
        const install_path = this.settings[`gppPath`];
        if (install_path.endsWith("g++") || install_path.endsWith("gpp.exe")) {
            return super.run(codeBlockContent, outputter, cmd, this.settings[`cArgs`], "cpp");
        } else {
            return super.run(codeBlockContent, outputter, cmd, this.settings[`cArgs`], "c");
        }
    }
}
