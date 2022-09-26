import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { Outputter } from "src/Outputter";
import { ExecutorSettings } from "src/Settings";
import AsyncExecutor from "./AsyncExecutor";
import Executor from "./Executor";


export default class PythonExecutor extends AsyncExecutor {

    process: ChildProcessWithoutNullStreams

    constructor(settings: ExecutorSettings) {
        super();

        const args = settings.nodeArgs ? settings.nodeArgs.split(" ") : [];

        args.unshift("-i");

        this.process = spawn(settings.nodePath, args);

        //send a newline so that the intro message won't be buffered
        this.dismissIntroMessage();
    }
    
    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
           this.process.kill();
           this.process.on("close", () => {
                resolve();
           });
        });
    }

    async dismissIntroMessage() {
        this.addJobToQueue((resolve, reject) => {            
            let stdoutBuffers = 0;
            let listener = () => {
                //we need 2 data messages: 1 for the welcome message, 1 for the prompt.
                stdoutBuffers++;
                if (stdoutBuffers >= 2) {
                    this.process.stdout.removeListener("data", listener);
                    resolve();
                }
            }
            this.process.stdout.on("data", listener);
        });
    }

    async run(code: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string) {
        return this.addJobToQueue((resolve, reject) => {
            
            const trimmedCode = code.trim() + "\n";
            this.process.stdin.write(trimmedCode, () => {
                let prompts = 0;
                const requiredPrompts = Array.from(trimmedCode.matchAll(/\n/g)).length;

                outputter.clear();

                let writeToStderr = (data: any) => {
                    outputter.writeErr(data.toString());
                };

                let writeToStdout = (data: any) => {
                    const stringData = data.toString();

                    //remove the prompts from the stdout stream (... on unfinished lines and > on finished lines)
                    const removedPrompts = stringData.replace(/(^((\.\.\. |>) )+)|(((\.\.\.|>) )+$)/g, "")

                    outputter.write(removedPrompts);

                    if (stringData.endsWith("> ")) prompts++;
                    if (prompts >= requiredPrompts) {
                        this.process.stdout.removeListener("data", writeToStdout);
                        this.process.stderr.removeListener("data", writeToStderr);
                        resolve();
                    }
                }

                this.process.stdout.on("data", writeToStdout);
                this.process.stderr.on("data", writeToStderr);
            });
        });
    }

}