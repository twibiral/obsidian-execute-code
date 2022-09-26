import { Notice } from "obsidian";
import { Outputter } from "src/Outputter";
import * as os from "os";

export default abstract class Executor {
    
    abstract run(code: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string): Promise<void>
    
    abstract stop(): Promise<void>
    
    /**
     * Creates new Notice that is displayed in the top right corner for a few seconds and contains an error message.
     * Additionally, the error is logged to the console and showed in the output panel ({@link Outputter}).
     *
     * @param cmd The command that was executed.
     * @param cmdArgs The arguments that were passed to the command.
     * @param tempFileName The name of the temporary file that contained the code.
     * @param err The error that was thrown.
     * @param outputter The outputter that should be used to display the error.
     * @protected
     */
    protected notifyError(cmd: string, cmdArgs: string, tempFileName: string, err: any, outputter: Outputter) {
        const errorMSG = `Error while executing ${cmd} ${cmdArgs} ${tempFileName}: ${err}`
        console.error(errorMSG);
        outputter.writeErr(errorMSG);
        new Notice("Error while executing code!");
    }
    
    /**
     * Creates a new unique file name for the given file extension. The file path is set to the temp path of the os.
     * The file name is the current timestamp: '/{temp_dir}/temp_{timestamp}.{file_extension}'
     *
     * @param ext The file extension. Should correspond to the language of the code.
     * @returns [string, number] The file path and the file name without extension.
     */
    protected getTempFile(ext: string): [string, number] {
        const now = Date.now();
        return [`${os.tmpdir()}/temp_${now}.${ext}`, now];
    }
}