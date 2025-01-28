import { EventEmitter } from "events";
import loadEllipses from "../svgs/loadEllipses";
import loadSpinner from "../svgs/loadSpinner";
import FileAppender from "./FileAppender";
import { App, Component, MarkdownRenderer, MarkdownView, normalizePath } from "obsidian";
import { ExecutorSettings } from "../settings/Settings";
import { ChildProcess } from "child_process";

export const TOGGLE_HTML_SIGIL = `TOGGLE_HTML_${Math.random().toString(16).substring(2)}`;

export class Outputter extends EventEmitter {
	codeBlockElement: HTMLElement;
	outputElement: HTMLElement;
	clearButton: HTMLButtonElement;
	lastPrintElem: HTMLSpanElement;
	lastPrinted: string;

	inputElement: HTMLInputElement;

	loadStateIndicatorElement: HTMLElement;

	htmlBuffer: string
	escapeHTML: boolean
	hadPreviouslyPrinted: boolean;
	inputState: "NOT_DOING" | "OPEN" | "CLOSED" | "INACTIVE";

	blockRunState: "RUNNING" | "QUEUED" | "FINISHED" | "INITIAL";

	saveToFile: FileAppender;
	settings: ExecutorSettings;

	runningSubprocesses = new Set<ChildProcess>();
	app: App;
	srcFile: string;

	constructor(codeBlock: HTMLElement, settings: ExecutorSettings, view: MarkdownView, app: App, srcFile: string) {
		super();
		this.settings = settings;
		this.app = app;
		this.srcFile = srcFile;

		this.inputState = this.settings.allowInput ? "INACTIVE" : "NOT_DOING";
		this.codeBlockElement = codeBlock;
		this.hadPreviouslyPrinted = false;
		this.escapeHTML = true;
		this.htmlBuffer = "";
		this.blockRunState = "INITIAL";

		this.saveToFile = new FileAppender(view, codeBlock.parentElement as HTMLPreElement);
	}

	/**
	 * Clears the output log.
	 */
	clear() {
		if (this.outputElement) {
			for (const child of Array.from(this.outputElement.children)) {
				if (child instanceof HTMLSpanElement)
					this.outputElement.removeChild(child);
			}
		}
		this.lastPrintElem = null;
		this.hadPreviouslyPrinted = false;
		this.lastPrinted = "";

		if (this.clearButton)
			this.clearButton.className = "clear-button-disabled";

		this.closeInput();
		this.inputState = "INACTIVE";

		// clear output block in file
		this.saveToFile.clearOutput();

		// Kill code block
		this.killBlock(this.runningSubprocesses);
	}

	/**
	 * Kills the code block.
	 * To be overwritten in an executor's run method
	 */
	killBlock(subprocesses?: Set<ChildProcess>) { }

	/**
	 * Hides the output and clears the log. Visually, restores the code block to its initial state.
	 */
	delete() {
		if (this.outputElement)
			this.outputElement.style.display = "none";

		this.clear()
	}

	/**
	 * Add a segment of stdout data to the outputter
	 * @param text The stdout data in question
	 */
	write(text: string) {
		this.processSigilsAndWriteText(text);

	}

	/**
	 * Add a segment of rendered markdown as stdout data to the outputter
	 * @param markdown The Markdown source code to be rendered as HTML
	 * @param addLineBreak whether to start a new line in stdout afterwards
	 * @param relativeFile Path of the markdown file. Used to resolve relative internal links.
	 */
	async writeMarkdown(markdown: string, addLineBreak?: boolean, relativeFile = this.srcFile) {
		if (relativeFile !== this.srcFile) {
			relativeFile = normalizePath(relativeFile);
		}
		const renderedEl = document.createElement("div");
		await MarkdownRenderer.render(this.app, markdown, renderedEl, relativeFile, new Component());
		for (const child of Array.from(renderedEl.children)) {
			this.write(TOGGLE_HTML_SIGIL + child.innerHTML + TOGGLE_HTML_SIGIL);
		}
		if (addLineBreak) this.write(`\n`);
	}

	/**
	 * Add a segment of stdout data to the outputter,
	 * processing `toggleHtmlSigil`s along the way.
	 * `toggleHtmlSigil`s may be interleaved with text and HTML
	 * in any way; this method will correctly interpret them.
	 * @param text The stdout data in question
	 */
	private processSigilsAndWriteText(text: string) {
		//Loop around, removing HTML toggling sigils
		while (true) {
			let index = text.indexOf(TOGGLE_HTML_SIGIL);
			if (index === -1) break;

			if (index > 0) this.writeRaw(text.substring(0, index));

			this.escapeHTML = !this.escapeHTML;
			this.writeHTMLBuffer(this.addStdout());

			text = text.substring(index + TOGGLE_HTML_SIGIL.length);
		}
		this.writeRaw(text);
	}

	/**
	 * Writes a segment of stdout data without caring about the HTML sigil
	 * @param text The stdout data in question
	 */
	private writeRaw(text: string) {
		//remove ANSI escape codes
		text = text.replace(/\x1b\\[;\d]*m/g, "")

		// Keep output field and clear button invisible if no text was printed.
		if (this.textPrinted(text)) {

			// make visible again:
			this.makeOutputVisible();
		}

		this.escapeAwareAppend(this.addStdout(), text);
	}

	/**
	 * Add a segment of stderr data to the outputter
	 * @param text The stderr data in question
	 */
	writeErr(text: string) {
		//remove ANSI escape codes
		text = text.replace(/\x1b\\[;\d]*m/g, "")

		// Keep output field and clear button invisible if no text was printed.
		if (this.textPrinted(text)) {
			// make visible again:
			this.makeOutputVisible()
		}

		this.addStderr().appendText(text);

	}

	/**
	 * Hide the input element. Stop accepting input from the user.
	 */
	closeInput() {
		this.inputState = "CLOSED";
		if (this.inputElement)
			this.inputElement.style.display = "none";
	}

	/**
	 * Mark the block as running
	 */
	startBlock() {
		if (!this.loadStateIndicatorElement) this.addLoadStateIndicator();
		setTimeout(() => {
			if (this.blockRunState !== "FINISHED")
				this.loadStateIndicatorElement.classList.add("visible");
		}, 100);


		this.loadStateIndicatorElement.empty();
		this.loadStateIndicatorElement.appendChild(loadSpinner());

		this.loadStateIndicatorElement.setAttribute("aria-label", "This block is running.\nClick to stop.");

		this.blockRunState = "RUNNING";
	}

	/**
	 * Marks the block as queued, but waiting for another block before running
	 */
	queueBlock() {
		if (!this.loadStateIndicatorElement) this.addLoadStateIndicator();
		setTimeout(() => {
			if (this.blockRunState !== "FINISHED")
				this.loadStateIndicatorElement.classList.add("visible");
		}, 100);

		this.loadStateIndicatorElement.empty();
		this.loadStateIndicatorElement.appendChild(loadEllipses());

		this.loadStateIndicatorElement.setAttribute("aria-label", "This block is waiting for another block to finish.\nClick to cancel.");

		this.blockRunState = "QUEUED";
	}

	/** Marks the block as finished running */
	finishBlock() {
		if (this.loadStateIndicatorElement) {
			this.loadStateIndicatorElement.classList.remove("visible");
		}

		this.blockRunState = "FINISHED";
	}

	private addLoadStateIndicator() {
		this.loadStateIndicatorElement = document.createElement("div");

		this.loadStateIndicatorElement.classList.add("load-state-indicator");

		// Kill code block on clicking load state indicator
		this.loadStateIndicatorElement.addEventListener('click', () => this.killBlock(this.runningSubprocesses));

		this.getParentElement().parentElement.appendChild(this.loadStateIndicatorElement);
	}

	private getParentElement() {
		return this.codeBlockElement.parentElement as HTMLDivElement;
	}

	private addClearButton() {
		const parentEl = this.getParentElement();

		this.clearButton = document.createElement("button");
		this.clearButton.className = "clear-button";
		this.clearButton.setText("Clear");
		this.clearButton.addEventListener("click", () => this.delete());

		parentEl.appendChild(this.clearButton);
	}

	private addOutputElement() {
		const parentEl = this.getParentElement();

		const hr = document.createElement("hr");

		this.outputElement = document.createElement("code");
		this.outputElement.classList.add("language-output");

		// TODO: Additionally include class executor-output?
		// this.outputElement.classList.add("executor-output");

		this.outputElement.appendChild(hr);
		if (this.inputState != "NOT_DOING") this.addInputElement();
		parentEl.appendChild(this.outputElement);
	}

	/**
	 * Add an interactive input element to the outputter
	 */
	private addInputElement() {
		this.inputElement = document.createElement("input");
		this.inputElement.classList.add("interactive-stdin");
		this.inputElement.addEventListener("keypress", (e) => {
			if (e.key == "Enter") {
				this.processInput(this.inputElement.value + "\n");
				this.inputElement.value = "";
			}
		})


		this.outputElement.appendChild(this.inputElement);
	}

	/**
	 * Ensure that input from a user gets echoed to the outputter before being emitted to event subscribers.
	 *
	 * @param input a line of input from the user. In most applications, should end with a newline.
	 */
	private processInput(input: string) {
		this.addStdin().appendText(input);

		this.emit("data", input);
	}

	private addStdin(): HTMLSpanElement {
		return this.addStreamSegmentElement("stdin");
	}

	private addStderr(): HTMLSpanElement {
		return this.addStreamSegmentElement("stderr");
	}

	private addStdout(): HTMLSpanElement {
		return this.addStreamSegmentElement("stdout");
	}

	/**
	 * Creates a wrapper element for a segment of a standard stream.
	 * In order to intermingle the streams as they are output to, segments
	 * are more effective than one-element-for-each.
	 *
	 * If the last segment was of the same stream, it will be returned instead.
	 *
	 * @param streamId The standard stream's name (stderr, stdout, or stdin)
	 * @returns the wrapper `span` element
	 */
	private addStreamSegmentElement(streamId: "stderr" | "stdout" | "stdin"): HTMLSpanElement {
		if (!this.outputElement) this.addOutputElement();

		if (this.lastPrintElem)
			if (this.lastPrintElem.classList.contains(streamId)) return this.lastPrintElem;

		const stdElem = document.createElement("span");
		stdElem.addClass(streamId);

		if (this.inputElement) {
			this.outputElement.insertBefore(stdElem, this.inputElement);
		} else {
			this.outputElement.appendChild(stdElem);
		}
		this.lastPrintElem = stdElem;

		return stdElem
	}

	/**
	 * Appends some text to a given element. Respects `this.escapeHTML` for whether or not to escape HTML.
	 * If not escaping HTML, appends the text to the HTML buffer to ensure that the whole HTML segment is recieved
	 * before parsing it.
	 * @param element Element to append to
	 * @param text text to append
	 */
	private escapeAwareAppend(element: HTMLElement, text: string) {
		if (this.escapeHTML) {
			// If we're escaping HTML, just append the text
			element.appendChild(document.createTextNode(text));

			if (this.settings.persistentOuput) {
				// Also append to file in separate code block
				this.saveToFile.addOutput(text);
			}

		} else {
			this.htmlBuffer += text;
		}
	}

	/**
	 * Parses the HTML buffer and appends its elements to a given parent element.
	 * Erases the HTML buffer afterwards.
	 * @param element element to append to
	 */
	private writeHTMLBuffer(element: HTMLElement) {
		if (this.htmlBuffer !== "") {
			this.makeOutputVisible();

			const content = document.createElement("div");
			content.innerHTML = this.htmlBuffer;
			for (const childElem of Array.from(content.childNodes))
				element.appendChild(childElem);

			// TODO: Include to file output,
			// this.saveToFile.addOutput(this.htmlBuffer);

			this.htmlBuffer = "";
		}
	}

	/**
	 * Checks if either:
	 * - this outputter has printed something before.
	 * - the given `text` is non-empty.
	 * If `text` is non-empty, this function will assume that it gets printed later.
	 *
	 * @param text Text which is to be printed
	 * @returns Whether text has been printed or will be printed
	 */
	private textPrinted(text: string) {
		if (this.hadPreviouslyPrinted) return true;

		if (text.contains(TOGGLE_HTML_SIGIL)) return false;
		if (text === "") return false;

		this.hadPreviouslyPrinted = true;
		return true;
	}

	/**
	 * Restores output elements after the outputter has been `delete()`d or `clear()`d.
	 * @see {@link delete()}
	 * @see {@link clear()}
	 */
	private makeOutputVisible() {
		this.closeInput();
		if (!this.clearButton) this.addClearButton();
		if (!this.outputElement) this.addOutputElement();

		this.inputState = "OPEN";
		this.outputElement.style.display = "block";
		this.clearButton.className = "clear-button";

		setTimeout(() => {
			if (this.inputState === "OPEN") this.inputElement.style.display = "inline";
		}, 1000)
	}
}
