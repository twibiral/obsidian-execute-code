import { Notice } from "obsidian";
import * as fs from "fs";
import * as child_process from "child_process";
import Executor from "./Executor";
import { Outputter } from "src/Outputter";
import { LanguageId } from "src/main";

export default class NonInteractiveCodeExecutor extends Executor {
    usesShell: boolean
    
    constructor(usesShell: boolean, file: string, language: LanguageId) {
        super(file, language);
        
        this.usesShell = usesShell;
    }
    
    stop(): Promise<void> {
        return Promise.resolve();
    }
    
    async run(codeBlockContent: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string) {
        new Notice("Running...");
        const [tempFileName, fileId] = this.getTempFile(ext)
        console.debug(`Execute ${cmd} ${cmdArgs} ${tempFileName}`);
        if (ext === "cpp")
            codeBlockContent = codeBlockContent.replace(/main\(\)/g, `temp_${fileId}()`);

        try {
            await fs.promises.writeFile(tempFileName, codeBlockContent);

            const args = cmdArgs ? cmdArgs.split(" ") : [];
            args.push(tempFileName);

            console.debug(`Execute ${cmd} ${args.join(" ")}`);
            const child = child_process.spawn(cmd, args, {shell: this.usesShell});

            await this.handleChildOutput(child, outputter, tempFileName);
        } catch (err) {
            this.notifyError(cmd, cmdArgs, tempFileName, err, outputter);
        }
    }

    private handleChildOutput(child: child_process.ChildProcessWithoutNullStreams, outputter: Outputter, fileName: string) {
        return new Promise((reject, resolve) => {
            outputter.clear();

            child.stdout.on('data', (data) => {
                outputter.write(data.toString());
            });
            child.stderr.on('data', (data) => {
                outputter.writeErr(data.toString());
            });

            outputter.on("data", (data: string) => {
                child.stdin.write(data);
            });

            child.on('close', (code) => {
                new Notice(code === 0 ? "Done!" : "Error!");

                outputter.closeInput();

                fs.promises.rm(fileName)
                    .catch((err) => {
                        console.error("Error in 'Obsidian Execute Code' Plugin while removing file: " + err);
                    })
                    .finally(() => {
                        resolve();
                    })
            });

            child.on('error', (err) => {
                new Notice("Error!");
                outputter.writeErr(err.toString());
                resolve();
            });
        });
    }
}