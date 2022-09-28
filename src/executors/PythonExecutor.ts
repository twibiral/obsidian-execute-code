import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import ExecuteCodePlugin from "src/main";
import { Outputter } from "src/Outputter";
import { ExecutorSettings } from "src/Settings";
import AsyncExecutor from "./AsyncExecutor";

export default class PythonExecutor extends AsyncExecutor {

    process: ChildProcessWithoutNullStreams

    constructor(settings: ExecutorSettings, file: string) {
        super(file, "python");

        const args = settings.pythonArgs ? settings.pythonArgs.split(" ") : [];

        args.unshift("-i");

        this.process = spawn(settings.pythonPath, args);

        //send a newline so that the intro message won't be buffered
        this.dismissIntroMessage();
    }
    
    /**
     * Close the runtime.
     * @returns A promise that resolves once the runtime is fully closed
     */
    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.process.kill();
            this.process.on("close", () => {
                resolve();
            });
            this.emit("close");
        });
    }

    /**
     * Swallows and rejects the "Welcome to Python v..." message that shows at startup
     */
    async dismissIntroMessage() {
        this.addJobToQueue((resolve, reject) => {
            this.process.stdin.write("\n");

            this.process.stderr.once("data", (data) => {
                resolve();
            });
        });
    }

    /**
     * Run some Python code
     * @param code code to run
     * @param outputter outputter to use
     * @param cmd Not used
     * @param cmdArgs Not used
     * @param ext Not used
     * @returns A promise that resolves once the code is done running
     */
    async run(code: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string) {
        return this.addJobToQueue((resolve, reject) => {
            const finishSigil = `SIGIL_BLOCK_DONE${Math.random()}_${Date.now()}_${code.length}`;
            
            //import print from builtins to circumnavigate the case where the user redefines print
            this.process.stdin.write(code + `\n\nfrom builtins import print\nprint("${finishSigil}", end = '')\n`);
            
            outputter.clear();
            
            outputter.on("data", (data: string) => {
                this.process.stdin.write(data);
            });

            let writeToStdout = (data: any) => {
                let str = data.toString();
                
                if (str.endsWith(finishSigil)) {
                    str = str.substring(0, str.length - finishSigil.length);
                    console.log(str);
                    
                    this.process.stdout.removeListener("data", writeToStdout)
                    this.process.stderr.removeListener("data", writeToStderr);
                    outputter.write(str);
                    
                    resolve();
                } else {
                    outputter.write(str);
                }
            };

            let writeToStderr = (data: any) => {
                const removedPrompts = data.toString().replace(/(^((\.\.\.|>>>) )+)|(((\.\.\.|>>>) )+$)/g, "")

                outputter.writeErr(removedPrompts);
            }

            this.process.stdout.on("data", writeToStdout);
            this.process.stderr.on("data", writeToStderr);
        });
    }

}