import { EventEmitter } from "events";


export class Outputter extends EventEmitter {
	codeBlockElement: HTMLElement;
	outputElement: HTMLElement;
	clearButton: HTMLButtonElement;
	lastPrintElem: HTMLSpanElement;
	lastPrinted: string;
	
	inputElement: HTMLInputElement;
	
	hadPreviouslyPrinted: boolean;

	constructor (codeBlock: HTMLElement) {
		super()
		
		this.codeBlockElement = codeBlock;
		this.hadPreviouslyPrinted = false;
	}

	clear() {
		if (this.outputElement) {
			for (const child of Array.from(this.outputElement.children)) {
				if (child instanceof HTMLSpanElement)
					this.outputElement.removeChild(child);
			}
		}
		this.hadPreviouslyPrinted = false;
		this.lastPrinted = "";

		if (this.clearButton)
			this.clearButton.className = "clear-button-disabled";
			
		this.closeInput();
	}

	delete() {
		if(this.outputElement)
			this.outputElement.style.display = "none";

		if(this.clearButton)
			this.clearButton.className = "clear-button-disabled";

		this.clear()
	}

	write(text: string) {		
		// Keep output field and clear button invisible if no text was printed.
		if(this.textPrinted(text)) {
			this.addStdout().innerHTML += text;

			// make visible again:
			this.makeOutputVisible();
		}
	}

	writeErr(text: string) {
		// Keep output field and clear button invisible if no text was printed.
		if(this.textPrinted(text)) {
			this.addStderr().appendText(text);

			// make visible again:
			this.makeOutputVisible()
		}
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

		let hr = document.createElement("hr");

		this.outputElement = document.createElement("code");
		this.outputElement.classList.add("language-output");

		this.outputElement.appendChild(hr);
		this.addInputElement();
		parentEl.appendChild(this.outputElement);
	}
	
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
	
	private addStreamSegmentElement(streamId: "stderr" | "stdout" | "stdin"): HTMLSpanElement {
		if (!this.outputElement) this.addOutputElement();

		if (this.lastPrintElem)
			if (this.lastPrintElem.classList.contains(streamId)) return this.lastPrintElem;

		const stdElem = document.createElement("span");
		stdElem.addClass(streamId);

		this.outputElement.appendChild(stdElem);

		this.lastPrintElem = stdElem;

		return stdElem
	}
	private textPrinted(text: string) {
		if(this.hadPreviouslyPrinted) return true;
		
		if(text == "") return false;
		
		this.hadPreviouslyPrinted = true;
		return true;
	}
	
	private makeOutputVisible() {
		if (!this.clearButton) this.addClearButton();
		if (!this.outputElement) this.addOutputElement();
		
		this.outputElement.style.display = "block";
		this.clearButton.className = "clear-button";
	}
}
