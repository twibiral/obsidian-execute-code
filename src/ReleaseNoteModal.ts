import {App, Component, MarkdownRenderer, Modal} from "obsidian";

export class ReleaseNoteModel extends Modal {
	private component: Component;

	constructor(app: App) {
		super(app);
		this.component = new Component();
	}

	onOpen() {
		let text =  '# Release Note: Execute Code Plugin v2.0.0\n\n'+
		'We are happy to announce the release of version 2.0.0. This release brings a special change: You can now make ' +
		'the output of your code blocks persistent.' +
		'If enabled, the output of your code blocks will be saved in the markdown file and will also be exported to PDF.' +
		'\n\n\n' +
		'You can enable this in the settings. Be aware that this feature is still experimental and might not work as expected. ' +
		'Check the [github page](https://github.com/twibiral/obsidian-execute-code) for more information.' +
		'\n\n\n' +
		'Thank you for using the Execute Code Plugin! ' +
		'[Here you can find a detailed change log.](https://github.com/twibiral/obsidian-execute-code/blob/master/CHANGELOG.md)' +
		'\n\n\n' +
		'If you enjoy using the plugin, consider supporting the development via [PayPal](https://www.paypal.com/paypalme/timwibiral) or [Buy Me a Coffee](https://www.buymeacoffee.com/twibiral).'

		this.component.load();
		MarkdownRenderer.render(this.app, text, this.contentEl, this.app.workspace.getActiveFile().path, this.component);
	}
}