import NonInteractiveCodeExecutor from "./NonInteractiveCodeExecutor";
import {Outputter} from "../output/Outputter";
import * as fs from "fs";
import * as child_process from "child_process";
import windowsPathToWsl from "../transforms/windowsPathToWsl";
import {ExecutorSettings} from "../settings/Settings";
import {LanguageId} from "../main";
import {Notice} from "obsidian";
import Executor from "./Executor";


/**
 * This class is identical to NoneInteractiveCodeExecutor, except that it uses the PowerShell encoding setting.
 * This is necessary because PowerShell still uses windows-1252 as default encoding for legacy reasons.
 * In this implementation, we use latin-1 as default encoding, which is basically the same as windows-1252.
 * See https://stackoverflow.com/questions/62557890/reading-a-windows-1252-file-in-node-js
 * and https://learn.microsoft.com/en-us/powershell/scripting/dev-cross-plat/vscode/understanding-file-encoding?view=powershell-7.3
 */
export default class PowerShellOnWindowsExecutor extends NonInteractiveCodeExecutor {
	constructor(settings: ExecutorSettings, file: string) {
		super(settings, true, file, "powershell");
	}

	stop(): Promise<void> {
		return Promise.resolve();
	}

	run(codeBlockContent: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string) {
		// Resolve any currently running blocks
		if (this.resolveRun !== undefined)
			this.resolveRun();
		this.resolveRun = undefined;

		return new Promise<void>((resolve, reject) => {
			const tempFileName = this.getTempFile(ext);

			fs.promises.writeFile(tempFileName, codeBlockContent, this.settings.powershellEncoding).then(() => {
				const args = cmdArgs ? cmdArgs.split(" ") : [];

				if (this.settings.wslMode) {
					args.unshift("-e", cmd);
					cmd = "wsl";
					args.push(windowsPathToWsl(tempFileName));
				} else {
					args.push(tempFileName);
				}

				const child = child_process.spawn(cmd, args, {env: process.env, shell: this.usesShell});

				this.handleChildOutput(child, outputter, tempFileName).then(() => {
					this.tempFileId = undefined; // Reset the file id to use a new file next time
				});

				// We don't resolve the promise here - 'handleChildOutput' registers a listener
				// For when the child_process closes, and will resolve the promise there
				this.resolveRun = resolve;
			}).catch((err) => {
				this.notifyError(cmd, cmdArgs, tempFileName, err, outputter);
				resolve();
			});
		});
	}
}
