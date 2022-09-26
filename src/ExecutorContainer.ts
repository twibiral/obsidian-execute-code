import Executor from "./executors/Executor";
import NodeJSExecutor from "./executors/NodeJSExecutor";
import NonInteractiveCodeExecutor from "./executors/NonInteractiveCodeExecutor";
import PythonExecutor from "./executors/PythonExecutor";
import ExecuteCodePlugin, { LanguageId } from "./main";

export default class ExecutorContainer implements Iterable<Executor> {
    executors: { [key in LanguageId]?: { [key: string]: Executor } } = {}
    plugin: ExecuteCodePlugin;
    
    constructor(plugin: ExecuteCodePlugin) {
        this.plugin = plugin;
    }
    * [Symbol.iterator](): Iterator<Executor> {
        for (const language in this.executors) {
            for(const file in this.executors[language as LanguageId]) {
                yield this.executors[language as LanguageId][file];
            }
        }
    }
    
    getExecutorFor(file: string, language: LanguageId) {
        if (!this.executors[language]) this.executors[language] = {}
        if (!this.executors[language][file]) this.executors[language][file] = this.createExecutorFor(language);
        
        return this.executors[language][file];
    }
    
    private createExecutorFor(language: LanguageId) {
        switch (language) {
            case "js": return new NodeJSExecutor(this.plugin.settings);
            case "python": return new PythonExecutor(this.plugin.settings);
        }
        return new NonInteractiveCodeExecutor(false);
    }
}