import {TextFileView, Workspace} from "obsidian";
import {runButtonClass} from "./main";

export default function runAllCodeBlocks(workspace: Workspace) {
	const lastActiveView = workspace.getMostRecentLeaf().view;

	if (lastActiveView instanceof TextFileView) {
		lastActiveView.containerEl.querySelectorAll("button." + runButtonClass).forEach((button: HTMLButtonElement) => {
			button.click();
		});
	}
}
