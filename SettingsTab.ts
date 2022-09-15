import {App, DropdownComponent, PluginSettingTab, Setting} from "obsidian";
import ExecuteCodePlugin from "./main";

export interface ExecutorSettings {
	timeout: number;
	nodePath: string;
	nodeArgs: string;
	pythonPath: string;
	pythonArgs: string;
	pythonEmbedPlots: boolean;
	shellPath: string;
	shellArgs: string;
	shellFileExtension: string;
	groovyPath: string;
	groovyArgs: any;
	groovyFileExtension: string;
	golangPath: string,
	golangArgs: string,
	golangFileExtension: string,
	javaPath: string,
	javaArgs: string,
	javaFileExtension: string,
	maxPrologAnswers: number;
	powershellPath: string;
	powershellArgs: string;
	powershellFileExtension: string;
	cargoPath: string;
	cargoArgs: string;
	cppRunner: string;
	cppInject: string;
	clingPath: string;
	clingArgs: string;
	clingStd: string;
	rustFileExtension: string,
	RPath: string;
	RArgs: string;
	REmbedPlots: boolean;
	kotlinPath: string;
	kotlinArgs: string;
	kotlinFileExtension: string;
}

export class SettingsTab extends PluginSettingTab {
	plugin: ExecuteCodePlugin;

	constructor(app: App, plugin: ExecuteCodePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for the Code Execution Plugin.'});

		// ========== Timeout ==========
		containerEl.createEl('h3', {text: 'Timout Settings'});
		new Setting(containerEl)
			.setName('Timeout (in seconds)')
			.setDesc('The time after which a program gets shut down automatically. This is to prevent infinite loops. ')
			.addText(text => text
				.setValue("" + this.plugin.settings.timeout / 1000)
				.onChange(async (value) => {
					if (Number(value) * 1000) {
						console.log('Timeout set to: ' + value);
						this.plugin.settings.timeout = Number(value) * 1000;
					}
					await this.plugin.saveSettings();
				}));


		// ========== JavaScript / Node ==========
		containerEl.createEl('h3', {text: 'JavaScript / Node Settings'});
		new Setting(containerEl)
			.setName('Node path')
			.addText(text => text
				.setValue(this.plugin.settings.nodePath)
				.onChange(async (value) => {
					let sanitized = this.sanitizePath(value);
					this.plugin.settings.nodePath = sanitized;
					console.log('Node path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Node arguments')
			.addText(text => text
				.setValue(this.plugin.settings.nodeArgs)
				.onChange(async (value) => {
					this.plugin.settings.nodeArgs = value;
					console.log('Node args set to: ' + value);
					await this.plugin.saveSettings();
				}));


		// ========== Java ==========
		containerEl.createEl('h3', {text: 'Java Settings'});
		new Setting(containerEl)
			.setName('Java path (Java 11 or higher)')
			.setDesc('The path to your Java installation.')
			.addText(text => text
				.setValue(this.plugin.settings.javaPath)
				.onChange(async (value) => {
					let sanitized = this.sanitizePath(value);
					this.plugin.settings.javaPath = sanitized;
					console.log('Java path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Java arguments')
			.addText(text => text
				.setValue(this.plugin.settings.javaArgs)
				.onChange(async (value) => {
					this.plugin.settings.javaArgs = value;
					console.log('Java args set to: ' + value);
					await this.plugin.saveSettings();
				}));


		// ========== Python ==========
		containerEl.createEl('h3', {text: 'Python Settings'});
		new Setting(containerEl)
			.setName('Embed Python Plots')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.pythonEmbedPlots)
				.onChange(async (value) => {
					this.plugin.settings.pythonEmbedPlots = value;
					console.log(value ? 'Embedding Plots into Notes.' : "Not embedding Plots into Notes.");
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Python path')
			.setDesc('The path to your Python installation.')
			.addText(text => text
				.setValue(this.plugin.settings.pythonPath)
				.onChange(async (value) => {
					let sanitized = this.sanitizePath(value);
					this.plugin.settings.pythonPath = sanitized;
					console.log('Python path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Python arguments')
			.addText(text => text
				.setValue(this.plugin.settings.pythonArgs)
				.onChange(async (value) => {
					this.plugin.settings.pythonArgs = value;
					console.log('Python args set to: ' + value);
					await this.plugin.saveSettings();
				}));


		// ========== Golang =========
		containerEl.createEl('h3', {text: 'Golang Settings'});
		new Setting(containerEl)
			.setName('Golang Path')
			.setDesc('The path to your Golang installation.')
			.addText(text => text
				.setValue(this.plugin.settings.golangPath)
				.onChange(async (value) => {
					let sanitized = this.sanitizePath(value);
					this.plugin.settings.golangPath = sanitized;
					console.log('Golang path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));


		// ========== Rust ===========
		containerEl.createEl('h3', {text: 'Rust Settings'});
		new Setting(containerEl)
			.setName('Cargo Path')
			.setDesc('The path to your Cargo installation.')
			.addText(text => text
				.setValue(this.plugin.settings.cargoPath)
				.onChange(async (value) => {
					let sanitized = this.sanitizePath(value);
					this.plugin.settings.cargoPath = sanitized;
					console.log('Cargo path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));


		// ========== C++ ===========
		containerEl.createEl('h3', {text: 'C++ Settings'});
		new Setting(containerEl)
			.setName('C++ Runner')
			.setDesc('Prefer Cling for the best C++ experience.')
			.addDropdown(dropdown => dropdown
				.addOption('jscpp', 'JSCPP')
				.addOption('cling', 'Cling')
				.setValue(this.plugin.settings.cppRunner)
				.onChange(async (value) => {
					this.plugin.settings.cppRunner = value;
					console.log('C++ runner set to: ' + value);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('C++ inject code')
			.setDesc('Code to add to the top of every C++ code block. Can be #include, #define, using directives, etc.')
			.setClass('settings-code-input-box')
			.addTextArea(textarea => textarea
				.setValue(this.plugin.settings.cppInject)
				.onChange(async (value) => {
					this.plugin.settings.cppInject = value;
					console.log('C++ inject set to: ' + value);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Cling path')
			.setDesc('The path to your Cling installation.')
			.addText(text => text
				.setValue(this.plugin.settings.clingPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
					this.plugin.settings.clingPath = sanitized;
					console.log('Cling path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Cling arguments')
			.addText(text => text
				.setValue(this.plugin.settings.clingArgs)
				.onChange(async (value) => {
					this.plugin.settings.clingArgs = value;
					console.log('Cling args set to: ' + value);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Cling std')
			.addDropdown(dropdown => dropdown
				.addOption('c++11', 'C++ 11')
				.addOption('c++14', 'C++ 14')
				.addOption('c++17', 'C++ 17')
				.setValue(this.plugin.settings.clingStd)
				.onChange(async (value) => {
					this.plugin.settings.clingStd = value;
					console.log('Cling std set to: ' + value);
					await this.plugin.saveSettings();
				}));


		// ========== Shell ==========
		containerEl.createEl('h3', {text: 'Shell Settings'});
		new Setting(containerEl)
			.setName('Shell path')
			.setDesc('The path to shell. Default is Bash but you can use any shell you want, e.g. bash, zsh, fish, ...')
			.addText(text => text
				.setValue(this.plugin.settings.shellPath)
				.onChange(async (value) => {
					let sanitized = this.sanitizePath(value);
					this.plugin.settings.shellPath = sanitized;
					console.log('Shell path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Shell arguments')
			.addText(text => text
				.setValue(this.plugin.settings.shellArgs)
				.onChange(async (value) => {
					this.plugin.settings.shellArgs = value;
					console.log('Shell args set to: ' + value);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Shell file extension')
			.setDesc('Changes the file extension for generated shell scripts. This is useful if you want to use a shell other than bash.')
			.addText(text => text
				.setValue(this.plugin.settings.shellFileExtension)
				.onChange(async (value) => {
					this.plugin.settings.shellFileExtension = value;
					console.log('Shell file extension set to: ' + value);
					await this.plugin.saveSettings();
				}));


		// ========== Powershell ==========
		containerEl.createEl('h3', {text: 'Powershell Settings'});
		new Setting(containerEl)
			.setName('Powershell path')
			.setDesc('The path to Powershell.')
			.addText(text => text
				.setValue(this.plugin.settings.powershellPath)
				.onChange(async (value) => {
					let sanitized = this.sanitizePath(value);
					this.plugin.settings.powershellPath = sanitized;
					console.log('Powershell path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Shell arguments')
			.addText(text => text
				.setValue(this.plugin.settings.powershellArgs)
				.onChange(async (value) => {
					this.plugin.settings.powershellArgs = value;
					console.log('Powershell args set to: ' + value);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Shell file extension')
			.setDesc('Changes the file extension for generated shell scripts. This is useful if you want to use a shell other than bash.')
			.addText(text => text
				.setValue(this.plugin.settings.powershellFileExtension)
				.onChange(async (value) => {
					this.plugin.settings.powershellFileExtension = value;
					console.log('Powershell file extension set to: ' + value);
					await this.plugin.saveSettings();
				}));


		// ========== Prolog ==========
		containerEl.createEl('h3', {text: 'Prolog Settings'});
		new Setting(containerEl)
			.setName('Prolog Answer Limit')
			.setDesc('Maximal number of answers to be returned by the Prolog engine. This is to prevent creating too huge texts in the notebook.')
			.addText(text => text
				.setValue("" + this.plugin.settings.maxPrologAnswers)
				.onChange(async (value) => {
					if (Number(value) * 1000) {
						console.log('Prolog answer limit set to: ' + value);
						this.plugin.settings.maxPrologAnswers = Number(value);
					}
					await this.plugin.saveSettings();
				}));


		// ========== Groovy ==========
		containerEl.createEl('h3', {text: 'Groovy Settings'});
		new Setting(containerEl)
			.setName('Groovy path')
			.setDesc('The path to your Groovy installation.')
			.addText(text => text
				.setValue(this.plugin.settings.groovyPath)
				.onChange(async (value) => {
					let sanitized = this.sanitizePath(value);
					this.plugin.settings.groovyPath = sanitized;
					console.log('Groovy path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Groovy arguments')
			.addText(text => text
				.setValue(this.plugin.settings.groovyArgs)
				.onChange(async (value) => {
					this.plugin.settings.groovyArgs = value;
					console.log('Groovy args set to: ' + value);
					await this.plugin.saveSettings();
				}));


		// ========== R ==========
		containerEl.createEl('h3', {text: 'R Settings'});
		new Setting(containerEl)
			.setName('Embed R Plots created via `plot()` into Notes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.REmbedPlots)
				.onChange(async (value) => {
					this.plugin.settings.REmbedPlots = value;
					console.log(value ? 'Embedding R Plots into Notes.' : "Not embedding R Plots into Notes.");
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('R path')
			.setDesc('The path to your R installation.')
			.addText(text => text
				.setValue(this.plugin.settings.RPath)
				.onChange(async (value) => {
					let sanitized = this.sanitizePath(value);
					this.plugin.settings.RPath = sanitized;
					console.log('R path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('R arguments')
			.addText(text => text
				.setValue(this.plugin.settings.RArgs)
				.onChange(async (value) => {
					this.plugin.settings.RArgs = value;
					console.log('R args set to: ' + value);
					await this.plugin.saveSettings();
				}));

		// ========== Kotlin ==========
		containerEl.createEl('h3', {text: 'Kotlin Settings'});
		new Setting(containerEl)
			.setName('Kotlin path')
			.setDesc('The path to your Kotlin installation.')
			.addText(text => text
				.setValue(this.plugin.settings.kotlinPath)
				.onChange(async (value) => {
					let sanitized = this.sanitizePath(value);
					this.plugin.settings.kotlinPath = sanitized;
					console.log('Kotlin path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Kotlin arguments')
			.addText(text => text
				.setValue(this.plugin.settings.kotlinArgs)
				.onChange(async (value) => {
					this.plugin.settings.kotlinArgs = value;
					console.log('Kotlin args set to: ' + value);
					await this.plugin.saveSettings();
				}));
	}

	private sanitizePath(path: string): string {
		path = path.replace(/\\/g, '/');
		path.replace(/['"`]/, '');
		path = path.trim();

		return path
	}
}
