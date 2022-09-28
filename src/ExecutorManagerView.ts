import { ItemView, Workspace, WorkspaceLeaf } from "obsidian";
import { basename } from "path";
import ExecutorContainer from "./ExecutorContainer";
import Executor from "./executors/Executor";

export const EXECUTOR_MANAGER_VIEW_ID = "code-execute-manage-executors";
export const EXECUTOR_MANAGER_OPEN_VIEW_COMMAND_ID = "code-execute-open-manage-executors";

export default class ExecutorManagerView extends ItemView {
    executors: ExecutorContainer;
    
    list: HTMLUListElement
    
    constructor(leaf: WorkspaceLeaf, executors: ExecutorContainer) {
        super(leaf);
        
        this.executors = executors;
        
        this.executors.on("add", (executor) => {
            this.addExecutorElement(executor);
        })
    }
    
    getViewType(): string {
        return EXECUTOR_MANAGER_VIEW_ID;
    }
    getDisplayText(): string {
        return "Execution Runtimes";
    }
    
    getIcon(): string {
        return "command-glyph";
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        
        let header = document.createElement("h3");
        header.textContent = "Runtimes";
        container.appendChild(header);
        
        this.list = document.createElement("ul");
        container.appendChild(this.list);
        
        for(const executor of this.executors) {
            this.addExecutorElement(executor);
        }
    }
    
    private addExecutorElement(executor: Executor) {
        
        console.log("adding!");
        const li = document.createElement("li");
        
        const simpleName = basename(executor.file);
        
        li.appendText(simpleName + "/" + executor.language);
        
        executor.on("close", () => {
            li.remove();
        });
        
        this.list.appendChild(li);
    }

    async onClose() {
        
    }
    
    static async activate(workspace: Workspace) {
        workspace.detachLeavesOfType(EXECUTOR_MANAGER_VIEW_ID);

        await workspace.getRightLeaf(false).setViewState({
            type: EXECUTOR_MANAGER_VIEW_ID,
            active: true,
        });

        workspace.revealLeaf(
            workspace.getLeavesOfType(EXECUTOR_MANAGER_VIEW_ID)[0]
        );
    }
}