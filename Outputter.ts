export class Outputter {
	codeBlockElement: HTMLElement;
	outputElement: HTMLElement;
	clearButton: HTMLButtonElement;
	textContent: string;

	constructor (codeBlock: HTMLElement) {
		this.codeBlockElement = codeBlock;
		this.textContent = "";
	}

	clear() {
		if(this.outputElement)
			this.outputElement.innerText = "";
	}

	delete() {
		if(this.outputElement)
			this.outputElement.style.display = "none";

		if(this.clearButton)
			this.clearButton.style.display = "none";

		this.clear()
	}

	write(text: string) {
		if(! this.outputElement) {
			const parentEl = this.codeBlockElement.parentElement as HTMLDivElement;

			this.outputElement = document.createElement("code");
			this.outputElement.classList.add("language-output");

			parentEl.appendChild(this.outputElement);
		}

		if(! this.clearButton) {
			const parentEl = this.codeBlockElement.parentElement as HTMLDivElement;

			this.clearButton = document.createElement("button");
			this.clearButton.className = "clear-button";
			this.clearButton.setText("Clear");
			this.clearButton.addEventListener("click", () => this.delete());

			parentEl.appendChild(this.clearButton);
		}

		// make visible again:
		this.outputElement.style.display = "block";
		this.clearButton.style.display = "block";

		this.outputElement.innerHTML += text;
	}

	writeErr(text: string) {
		if(! this.outputElement) {
			const parentEl = this.codeBlockElement.parentElement as HTMLDivElement;

			this.outputElement = document.createElement("code");
			this.outputElement.classList.add("language-output");

			parentEl.appendChild(this.outputElement);
		}

		if(! this.clearButton) {
			const parentEl = this.codeBlockElement.parentElement as HTMLDivElement;

			this.clearButton = document.createElement("button");
			this.clearButton.className = "clear-button";
			this.clearButton.setText("Clear");
			this.clearButton.addEventListener("click", () => this.delete());

			parentEl.appendChild(this.clearButton);
		}

		// make visible again:
		this.outputElement.style.display = "block";
		this.clearButton.style.display = "block";

		this.outputElement.innerHTML += '<font color="red">' + text + '</font>';
	}
}
