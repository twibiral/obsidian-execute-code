import type { Outputter } from "src/output/Outputter";
import type { ExecutorSettings } from "src/settings/Settings";
import ClingExecutor from './ClingExecutor';
import GppExecutor from './G++Executor';

class ClingConcrete extends ClingExecutor {
    constructor(settings: ExecutorSettings, file: string) {
        super(settings, file, "cpp");
    }
}

export default class CppExecutor extends GppExecutor {
    private clingEngine: ClingConcrete;

    constructor(settings: ExecutorSettings, file: string) {
        super(settings, file, "cpp");
        this.clingEngine = new ClingConcrete(settings, file);
    }

    override run(codeBlockContent: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string) {
        const path = this.settings.clingPath || "";
        const isCling = path.toLowerCase().includes("cling");

        if (isCling) {
            // Cling 
            const std = this.settings.clingStd || "c++17";
            const args = `-std=${std} ${cmdArgs}`;
            console.log("Using Cling execution...");
            return this.clingEngine.run(codeBlockContent, outputter, path, args, "cpp");
        } else {
            // G++ 
            const std = this.settings.gppStd || "c++17";
            const args = `-std=${std} ${cmdArgs}`;
            const gppPath = this.settings.gppPath || "g++"; 
            console.log("Using G++ compilation...");
            return super.run(codeBlockContent, outputter, gppPath, args, "cpp");
        }

    }
}