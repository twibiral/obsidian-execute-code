import type {App, FileSystemAdapter} from "obsidian";
import {MarkdownView} from "obsidian";

/**
* Get the full HTML content of the current MarkdownView
*
* @param view - The MarkdownView to get the HTML from
* @returns The full HTML of the MarkdownView
*/
function getFullContentHtml(view: MarkdownView): string {
	const codeMirror = view.editor.cm;
	codeMirror.viewState.printing = true;
	codeMirror.measure();
	const html = view.contentEl.innerHTML;
	codeMirror.viewState.printing = false;
	codeMirror.measure();
	return html;
}

/**
 * Tries to get the active view from obsidian and returns a dictionary containing the file name, folder path,
 * file path, and vault path of the currently opened / focused note.
 *
 * @param app The current app handle (this.app from ExecuteCodePlugin)
 * @returns { fileName: string; folder: string; filePath: string; vaultPath: string; fileContent: string } A dictionary containing the
 * file name, folder path, file path, vault pat, and file content of the currently opened / focused note.
 */
export function getVaultVariables(app: App) {
	const activeView = app.workspace.getActiveViewOfType(MarkdownView);
	if (activeView === null) {
		return null;
	}

	const adapter = app.vault.adapter as FileSystemAdapter;
	const vaultPath = adapter.getBasePath();
	const folder = activeView.file.parent.path;
	const fileName = activeView.file.name
	const filePath = activeView.file.path
	const fileContent = getFullContentHtml(activeView);

	const theme = document.body.classList.contains("theme-light") ? "light" : "dark";

	return {
		vaultPath: vaultPath,
		folder: folder,
		fileName: fileName,
		filePath: filePath,
		theme: theme,
		fileContent: fileContent
	}
}
