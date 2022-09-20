export class Outputter {
	codeBlockElement: HTMLElement;
	outputElement: HTMLElement;
	clearButton: HTMLButtonElement;
	stdoutElem: HTMLSpanElement;
	stderrElem: HTMLSpanElement;
	stdoutText: string;
	stderrText: string;

	constructor (codeBlock: HTMLElement) {
		this.codeBlockElement = codeBlock;
		this.stdoutText = "";
		this.stderrText = "";
	}

	clear() {
		if (this.outputElement) {
			this.stdoutElem.setText("");
			this.stderrElem.setText("");
		}
		this.stdoutText = "";
		this.stderrText = "";

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
		if (!this.outputElement) {
			this.addOutputElement();
		}

		if (!this.clearButton) {
			this.addClearButton();
		}

		this.stdoutText += text;

		// Keep output field and clear button invisible if no text was printed.
		if (!this.stderrText && !this.stdoutText) return;

		this.stdoutElem.innerHTML = this.stdoutText;

		// make visible again:
		this.outputElement.style.display = "block";
		this.clearButton.className = "clear-button";
	}

	writeErr(text: string) {
		if (!this.outputElement) {
			this.addOutputElement();
		}

		if (!this.clearButton) {
			this.addClearButton();
		}

		this.stderrText += text;

		// Keep output field and clear button invisible if no text was printed.
		if (!this.stderrText && !this.stdoutText) return;

		this.stderrElem.setText(this.stderrText);

		// make visible again:
		this.outputElement.style.display = "block";
		this.clearButton.className = "clear-button";
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

		this.stdoutElem = document.createElement("span");
		this.stdoutElem.addClass("stdout");

		this.stderrElem = document.createElement("span");
		this.stderrElem.addClass("stderr");

		this.outputElement.appendChild(hr);
		this.outputElement.appendChild(this.stdoutElem);
		this.outputElement.appendChild(this.stderrElem);
		parentEl.appendChild(this.outputElement);
	}
}
