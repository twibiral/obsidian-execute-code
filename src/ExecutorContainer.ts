import Executor from "./executors/Executor";
import NodeJSExecutor from "./executors/NodeJSExecutor";
import NonInteractiveCodeExecutor from "./executors/NonInteractiveCodeExecutor";
import PythonExecutor from "./executors/PythonExecutor";
import ExecuteCodePlugin, { LanguageId } from "./main";

export default class ExecutorContainer {
    executors: { [key in LanguageId]?: { [key: string]: Executor } } = {}
    plugin: ExecuteCodePlugin;
    
    constructor(plugin: ExecuteCodePlugin) {
        this.plugin = plugin;
    }
    
    getExecutorFor(file: string, language: LanguageId) {
        if (!this.executors[language]) this.executors[language] = {}
        if (!this.executors[language][file]) this.executors[language][file] = this.createExecutorFor(language);
        
        return this.executors[language][file];
    }
    
    private createExecutorFor(language: LanguageId) {
        switch (language) {
            case "python": return new PythonExecutor(this.plugin.settings);
        }
        return new NonInteractiveCodeExecutor(false);
    }
}