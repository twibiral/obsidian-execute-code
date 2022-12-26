import type {App, FileSystemAdapter} from "obsidian";
import {MarkdownView} from "obsidian";

/**
 * Tries to get the active view from obsidian and returns a dictionary containing the file name, folder path,
 * file path, and vault path of the currently opened / focused note.
 *
 * @param app The current app handle (this.app from ExecuteCodePlugin)
 * @returns { fileName: string; folder: string; filePath: string; vaultPath: string } A dictionary containing the
 * file name, folder path, file path, and vault path of the currently opened / focused note.
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

	const theme = document.body.classList.contains("theme-light") ? "light" : "dark";

	return {
		vaultPath: vaultPath,
		folder: folder,
		fileName: fileName,
		filePath: filePath,
		theme: theme
	}
}
