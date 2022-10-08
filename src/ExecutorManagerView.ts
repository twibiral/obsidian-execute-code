import {ItemView, setIcon, Workspace, WorkspaceLeaf} from "obsidian";
import {basename} from "path";
import ExecutorContainer from "./ExecutorContainer";
import Executor from "./executors/Executor";

export const EXECUTOR_MANAGER_VIEW_ID = "code-execute-manage-executors";
export const EXECUTOR_MANAGER_OPEN_VIEW_COMMAND_ID = "code-execute-open-manage-executors";

export default class ExecutorManagerView extends ItemView {
	executors: ExecutorContainer;

	list: HTMLUListElement
	emptyStateElement: HTMLDivElement;

	constructor(leaf: WorkspaceLeaf, executors: ExecutorContainer) {
		super(leaf);

		this.executors = executors;

		this.executors.on("add", (executor) => {
			this.addExecutorElement(executor);
		});
	}

	/**
	 * Open the view. Ensure that there may only be one view at a time.
	 * If there isn't one created, then create a new one.
	 * @param workspace the workspace of the Obsidian app
	 */
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

	getViewType(): string {
		return EXECUTOR_MANAGER_VIEW_ID;
	}

	getDisplayText(): string {
		return "Execution Runtimes";
	}

	getIcon(): string {
		return "command-glyph";
	}

	/**
	 * Set up the HTML of the view
	 */
	async onOpen() {
		const container = this.contentEl;
		container.empty();

		container.classList.add("manage-executors-view");

		const header = document.createElement("h3");
		header.textContent = "Runtimes";
		container.appendChild(header);

		this.list = document.createElement("ul");
		container.appendChild(document.createElement("div")).appendChild(this.list);

		for (const executor of this.executors) {
			this.addExecutorElement(executor);
		}

		this.addEmptyState();
	}

	async onClose() {

	}

	/**
	 * Add the empty state element to the view. Also update the empty state element
	 */
	private addEmptyState() {
		this.emptyStateElement = document.createElement("div");
		this.emptyStateElement.classList.add("empty-state");
		this.emptyStateElement.textContent = "There are currently no runtimes online. Run some code blocks, and their runtimes will appear here.";

		this.list.parentElement.appendChild(this.emptyStateElement);

		this.updateEmptyState();
	}

	/**
	 * If the list of runtimes is empty, then show the empty-state; otherwise, hide it.
	 */
	private updateEmptyState() {
		if (this.list.childElementCount == 0) {
			this.emptyStateElement.style.display = "block";
		} else {
			this.emptyStateElement.style.display = "none";
		}
	}

	/**
	 * Creates and adds a manager widget list-item for a given executor.
	 *
	 * @param executor an executor to create a manager widget for
	 */
	private addExecutorElement(executor: Executor) {
		const li = document.createElement("li");

		const simpleName = basename(executor.file);

		const langElem = document.createElement("small");
		langElem.textContent = executor.language;
		li.appendChild(langElem);

		li.appendChild(this.createFilenameRowElem(simpleName));

		executor.on("close", () => {
			li.remove();
			this.updateEmptyState();
		});

		const button = document.createElement("button");
		button.addEventListener("click", () => executor.stop());
		setIcon(button, "trash");
		button.setAttribute("aria-label", "Stop Runtime");
		li.appendChild(button);

		this.list.appendChild(li);
		this.updateEmptyState();
	}

	/**
	 * A helper method to create a file-name label for use in
	 * runtime management widgets
	 * @param text text content for the filename label
	 * @returns the filename label's html element
	 */
	private createFilenameRowElem(text: string) {
		const fElem = document.createElement("span");
		fElem.textContent = text;
		fElem.classList.add("filename");
		return fElem;
	}
}
