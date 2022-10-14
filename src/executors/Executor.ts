import {Notice} from "obsidian";
import {Outputter} from "src/output/Outputter";
import * as os from "os";
import {LanguageId} from "src/main";
import {EventEmitter} from "stream";

export default abstract class Executor extends EventEmitter {
	language: LanguageId;
	file: string;
	tempFileId: string | undefined = undefined;

	constructor(file: string, language: LanguageId) {
		super();
		this.file = file;
		this.language = language;
	}

	/**
	 * Run the given `code` and add all output to the `Outputter`. Resolves the promise once the code is done running.
	 *
	 * @param code code to run
	 * @param outputter outputter to use for showing output to the user
	 * @param cmd command to run (not used by all executors)
	 * @param cmdArgs arguments for command to run (not used by all executors)
	 * @param ext file extension for the programming language (not used by all executors)
	 */
	abstract run(code: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string): Promise<void>

	/**
	 * Exit the runtime for the code.
	 */
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
	 * this.tempFileId will be updated, accessible to other methods
	 * Once finished using this value, remember to set it to undefined to generate a new file
	 *
	 * @param ext The file extension. Should correspond to the language of the code.
	 * @returns The temporary file path
	 */
	protected getTempFile(ext: string) {
		if (this.tempFileId === undefined)
			this.tempFileId = Date.now().toString();
		return `${os.tmpdir()}/temp_${this.tempFileId}.${ext}`;
	}
}
