import { TextFileView, Workspace } from "obsidian";
import { buttonClass } from './RunButton';

export default function runAllCodeBlocks(workspace: Workspace) {
	const lastActiveView = workspace.getMostRecentLeaf().view;

	if (lastActiveView instanceof TextFileView) {
		lastActiveView.containerEl.querySelectorAll("button." + buttonClass).forEach((button: HTMLButtonElement) => {
			button.click();
		});
	}
}
