import Executor from './Executor';
import * as child_process from "child_process";
import type { ChildProcessWithoutNullStreams } from "child_process";
import type { Outputter } from "src/output/Outputter";
import type { ExecutorSettings } from "src/settings/Settings";
import * as path from "path";
import * as os from "os";
import { Notice } from "obsidian";

export default abstract class GppExecutor extends Executor {
	// Rotation counter for shared output files (cycles through 0, 1, 2)
	private static rotationIndex: number = 0;

	language: "cpp" | "c"
	settings: ExecutorSettings;
	usesShell: boolean = false;
	stdoutCb: (chunk: any) => void;
	stderrCb: (chunk: any) => void;
	resolveRun: (value: void | PromiseLike<void>) => void | undefined = undefined;

	constructor(settings: ExecutorSettings, file: string, language: "c" | "cpp") {
		super(file, language);
		this.settings = settings;
	}

	stop(): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Get the next output file in rotation (shared1.out, shared2.out, shared3.out)
	 * Files are stored in the OS temp directory (e.g., /tmp/)
	 */
	private getNextOutputFile(): string {
		const index = (GppExecutor.rotationIndex % 3) + 1; // Returns 1, 2, or 3
		GppExecutor.rotationIndex++;
		
		// Use OS temp directory to avoid ASAR archive issues with Electron
		return path.join(os.tmpdir(), `shared${index}.out`);
	}

	override run(codeBlockContent: string, outputter: Outputter, _cmd: string, args: string, ext: string) {
		console.log("G++Executor: run() called");
		// Resolve any currently running blocks
		if (this.resolveRun !== undefined)
			this.resolveRun();
		this.resolveRun = undefined;

		return new Promise<void>((resolve, _reject) => {
			console.log("G++Executor: Starting compilation");
			outputter.clear();

			// For g++, we don't rename main() - code must have a main() function
			const code = codeBlockContent;

			// Get the next rotating output file
			const outputFile = this.getNextOutputFile();
			
			// Determine language flag for g++ (-x c++ or -x c)
			const langFlag = ext === "cpp" || ext === "c++" ? "c++" : "c";
			
			// Build compilation arguments
			// Format: g++ -x {c++|c} -o <output_file> <user_args> -
			const compileArgs = [
				`-x`, langFlag,           // Explicitly specify language
				`-o`, outputFile,         // Output to rotating shared file
				...args.split(" ").filter(arg => arg.length > 0), // User-provided args
				`-`                       // Read source from stdin
			];

			// Spawn g++ compiler
			const compileChild = child_process.spawn(this.settings.gppPath, compileArgs, {
				env: process.env,
				shell: this.usesShell
			});

			let compileStderr = "";

			// Capture compilation errors
			compileChild.stderr.on('data', (data) => {
				compileStderr += data.toString();
			});

			compileChild.on('error', (err) => {
				new Notice("Compilation Error!");
				outputter.writeErr(err.toString());
				outputter.closeInput();
				resolve();
			});

			compileChild.on('close', (code) => {
				console.log("G++Executor: Compilation finished with code", code);
				if (code !== 0) {
					// Compilation failed - show errors to user
					new Notice("Compilation Error!");
					outputter.writeErr(compileStderr);
					outputter.closeInput();
					console.log("G++Executor: Compilation failed, resolving promise");
					resolve();
				} else {
					// Compilation succeeded - execute the compiled binary
					console.log("G++Executor: Compilation succeeded, spawning executable");
					const executeChild = child_process.spawn(outputFile, [], {
						env: process.env,
						shell: this.usesShell
					});

					// Handle execution output (don't wait for it to finish)
					this.handleChildOutput(executeChild, outputter);
					
					// Resolve immediately after spawning execution
					console.log("G++Executor: Execution spawned, resolving promise");
					resolve();
				}
			});

			// Write source code to compiler's stdin
			compileChild.stdin.write(code);
			compileChild.stdin.end();
		});
	}

	/**
	 * Handles the output of the executing child process and redirects stdout and stderr to the Outputter.
	 * Returns a Promise that resolves when the child process closes.
	 */
	protected handleChildOutput(child: ChildProcessWithoutNullStreams, outputter: Outputter): Promise<void> {
		return new Promise<void>((resolve) => {
			// Kill process on clear button click
			outputter.killBlock = () => {
				child.kill('SIGINT');
			}

			this.stdoutCb = (data) => {
				outputter.write(data.toString());
			};
			
			this.stderrCb = (data) => {
				outputter.writeErr(data.toString());
			};

			child.stdout.on('data', this.stdoutCb);
			child.stderr.on('data', this.stderrCb);

			// Allow user input to be passed to the executing program
			outputter.on("data", (data: string) => {
				child.stdin.write(data);
			});

			child.on('exit', (code) => {
				console.log("G++Executor: Child process exited with code", code);
			});

			child.on('close', (code) => {
				console.log("G++Executor: Child process closed with code", code);
				if (code !== 0)
					new Notice("Execution Error!");

				outputter.closeInput();

				// Resolve both the handleChildOutput promise and the run promise
				console.log("G++Executor: Resolving handleChildOutput promise");
				resolve();
			});

			child.on('error', (err) => {
				console.error("G++Executor: Child process error", err);
				new Notice("Execution Error!");
				outputter.writeErr(err.toString());
				resolve(); // Also resolve on error to prevent hanging
			});
		});
	}
}
