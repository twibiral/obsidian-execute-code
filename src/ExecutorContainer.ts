import {EventEmitter} from "events";
import Executor from "./executors/Executor";
import NodeJSExecutor from "./executors/NodeJSExecutor";
import NonInteractiveCodeExecutor from "./executors/NonInteractiveCodeExecutor";
import PrologExecutor from "./executors/PrologExecutor";
import PythonExecutor from "./executors/python/PythonExecutor";
import CppExecutor from './executors/CppExecutor';
import ExecuteCodePlugin, {LanguageId} from "./main";
import RExecutor from "./executors/RExecutor.js";
import CExecutor from "./executors/CExecutor";
import FSharpExecutor from "./executors/FSharpExecutor";

const interactiveExecutors: Partial<Record<LanguageId, any>> = {
	"js": NodeJSExecutor,
	"python": PythonExecutor,
	"r": RExecutor
};

const nonInteractiveExecutors: Partial<Record<LanguageId, any>> = {
	"prolog": PrologExecutor,
	"cpp": CppExecutor,
	"c": CExecutor,
	"fsharp": FSharpExecutor
};

export default class ExecutorContainer extends EventEmitter implements Iterable<Executor> {
	executors: { [key in LanguageId]?: { [key: string]: Executor } } = {}
	plugin: ExecuteCodePlugin;

	constructor(plugin: ExecuteCodePlugin) {
		super();
		this.plugin = plugin;
		
		window.addEventListener("beforeunload", async () => {
			for(const executor of this) {
				executor.stop();
			}
		});
	}

	/**
	 * Iterate through all executors
	 */
	* [Symbol.iterator](): Iterator<Executor> {
		for (const language in this.executors) {
			for (const file in this.executors[language as LanguageId]) {
				yield this.executors[language as LanguageId][file];
			}
		}
	}

	/**
	 * Gets an executor for the given file and language. If the language in
	 * question *may* be interactive, then the executor will be cached and re-returned
	 * the same for subsequent calls with the same arguments.
	 * If there isn't a cached executor, it will be created.
	 *
	 * @param file file to get an executor for
	 * @param language language to get an executor for.
	 * @param needsShell whether or not the language requires a shell
	 */
	getExecutorFor(file: string, language: LanguageId, needsShell: boolean) {
		if (!this.executors[language]) this.executors[language] = {}
		if (!this.executors[language][file]) this.setExecutorInExecutorsObject(file, language, needsShell);

		return this.executors[language][file];
	}

	/**
	 * Create an executor and put it into the `executors` dictionary.
	 * @param file the file to associate the new executor with
	 * @param language the language to associate the new executor with
	 * @param needsShell whether or not the language requires a shell
	 */
	private setExecutorInExecutorsObject(file: string, language: LanguageId, needsShell: boolean) {
		const exe = this.createExecutorFor(file, language, needsShell);
		if (!(exe instanceof NonInteractiveCodeExecutor)) this.emit("add", exe);
		exe.on("close", () => {
			delete this.executors[language][file];
		});

		this.executors[language][file] = exe;
	}

	/**
	 * Creates an executor
	 *
	 * @param file the file to associate the new executor with
	 * @param language the language to make an executor for
	 * @param needsShell whether or not the language requires a shell
	 * @returns a new executor associated with the given language and file
	 */
	private createExecutorFor(file: string, language: LanguageId, needsShell: boolean) {
		// Interactive language executor
		if (this.plugin.settings[`${language}Interactive`]) {
			if (!(language in interactiveExecutors))
				throw new Error(`Attempted to use interactive executor for '${language}' but no such executor exists`);
			return new interactiveExecutors[language](this.plugin.settings, file);
		}
		// Custom non-interactive language executor
		else if (language in nonInteractiveExecutors)
			return new nonInteractiveExecutors[language](this.plugin.settings, file);
		// Generic non-interactive language executor
		return new NonInteractiveCodeExecutor(this.plugin.settings, needsShell, file, language);
	}
}
