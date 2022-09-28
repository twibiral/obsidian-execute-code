import { EventEmitter } from "events";
import Executor from "./executors/Executor";
import NodeJSExecutor from "./executors/NodeJSExecutor";
import NonInteractiveCodeExecutor from "./executors/NonInteractiveCodeExecutor";
import PythonExecutor from "./executors/PythonExecutor";
import ExecuteCodePlugin, { LanguageId } from "./main";

export default class ExecutorContainer extends EventEmitter implements Iterable<Executor> {
    executors: { [key in LanguageId]?: { [key: string]: Executor } } = {}
    plugin: ExecuteCodePlugin;
    
    constructor(plugin: ExecuteCodePlugin) {
        super();
        this.plugin = plugin;
    }
    
    /**
     * Iterate through all executors
     */
    * [Symbol.iterator](): Iterator<Executor> {
        for (const language in this.executors) {
            for(const file in this.executors[language as LanguageId]) {
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
     */
    getExecutorFor(file: string, language: LanguageId) {
        if (!this.executors[language]) this.executors[language] = {}
        if (!this.executors[language][file]) this.setExecutorInExecutorsObject(file, language);
        
        return this.executors[language][file];
    }
    
    /**
     * Create an executor and put it into the `executors` dictionary.
     * @param file the file to associate the new executor with
     * @param language the language to associate the new executor with
     */
    private setExecutorInExecutorsObject(file: string, language: LanguageId) {
        const exe = this.createExecutorFor(file, language);
        if (!(exe instanceof NonInteractiveCodeExecutor)) this.emit("add", exe);
        exe.on("close", () => {
            delete this.executors[language][file];
        });
        
        this.executors[language][file] = this.createExecutorFor(file, language);
    }
    
    /**
     * Creates an executor
     * 
     * @param file the file to associate the new executor with
     * @param language the language to make an executor for
     * @returns a new executor associated with the given language and file
     */
    private createExecutorFor(file: string, language: LanguageId) {
        switch (language) {
            case "js": return new NodeJSExecutor(this.plugin.settings, file);
            case "python": return new PythonExecutor(this.plugin.settings, file);
        }
        return new NonInteractiveCodeExecutor(false, file, language);
    }
}