import {Notice} from "obsidian";
import * as JSON5 from "json5";

export type ExportType = "pre" | "post";

/**
 * Arguments for code blocks, specified next to the language identifier as JSON
 * @example ```python {"export": "pre"}
 * @example ```cpp {"ignoreExport": ["post"]}
 */
export interface CodeBlockArgs {
	label?: string;
	import?: string | string[];
	export?: ExportType | ExportType[];
	ignore?: (ExportType | "global")[] | ExportType | "global" | "all";
}

/**
 * Get code block args given the first line of the code block.
 *
 * @param firstLineOfCode The first line of a code block that contains the language name.
 * @returns The arguments from the first line of the code block.
 */
export function getArgs(firstLineOfCode: string): CodeBlockArgs {
	// No args specified
	if (!firstLineOfCode.contains("{") && !firstLineOfCode.contains("}"))
		return {};
	try {
		let args = firstLineOfCode.substring(firstLineOfCode.indexOf("{") + 1).trim();
		// Transform custom syntax to JSON5
		args = args.replace(/=/g, ":");
		// Handle unnamed export arg - pre / post at the beginning of the args without any arg name
		const exports: ExportType[] = [];
		const handleUnnamedExport = (exportName: ExportType) => {
			let i = args.indexOf(exportName);
			while (i !== -1) {
				const nextChar = args[i + exportName.length];
				if (nextChar !== `"` && nextChar !== `'`) {
					// Remove from args string
					args = args.substring(0, i) + args.substring(i + exportName.length + (nextChar === "}" ? 0 : 1));
					exports.push(exportName);
				}
				i = args.indexOf(exportName, i + 1);
			}
		};
		handleUnnamedExport("pre");
		handleUnnamedExport("post");
		args = `{export: ['${exports.join("', '")}'], ${args}`;
		return JSON5.parse(args);
	} catch (err) {
		new Notice(`Failed to parse code block arguments from line:\n${firstLineOfCode}\n\nFailed with error:\n${err}`);
		return {};
	}
}
