export class Outputter {
	codeBlockElement: HTMLElement;
	outputElement: HTMLElement;
	clearButton: HTMLButtonElement;
	lastPrintElem: HTMLSpanElement;
	lastPrinted: string;
	
	hadPreviouslyPrinted: boolean;

	constructor (codeBlock: HTMLElement) {
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
		parentEl.appendChild(this.outputElement);
	}
	
	private addStderr(): HTMLSpanElement {
		if (!this.outputElement) this.addOutputElement();
		
		if(this.lastPrintElem)
			if (this.lastPrintElem.classList.contains("stderr")) return this.lastPrintElem;
		
		const stderrElem = document.createElement("span");
		stderrElem.addClass("stderr");
		
		this.outputElement.appendChild(stderrElem);
		
		this.lastPrintElem = stderrElem;
		
		return stderrElem
	}
	
	private addStdout(): HTMLSpanElement {
		if (!this.outputElement) this.addOutputElement();
		
		if (this.lastPrintElem)
			if(this.lastPrintElem.classList.contains("stdout")) return this.lastPrintElem;
		
		const stdoutElem = document.createElement("span");
		stdoutElem.addClass("stdout");

		this.outputElement.appendChild(stdoutElem);

		this.lastPrintElem = stdoutElem;

		return stdoutElem
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
