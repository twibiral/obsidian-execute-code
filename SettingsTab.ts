import {App, PluginSettingTab, Setting} from "obsidian";
import ExecuteCodePlugin from "./main";

export interface ExecutorSettings {
	timeout: number;
	nodePath: string;
	nodeArgs: string;
	pythonPath: string;
	pythonArgs: string;
	bashPath: string;
	bashArgs: string;
	maxPrologAnswers: number;
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

		new Setting(containerEl)
			.setName('Timeout (in seconds)')
			.setDesc('The time after which a program gets shut down automatically. This is to prevent infinite loops. ')
			.addText(text => text
				.setValue("" + this.plugin.settings.timeout/1000)
				.onChange(async (value) => {
					if( Number(value) * 1000){
						console.log('Timeout set to: ' + value);
						this.plugin.settings.timeout = Number(value) * 1000;
					}
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Node path')
			.addText(text => text
				.setValue(this.plugin.settings.nodePath)
				.onChange(async (value) => {
					this.plugin.settings.nodePath = value;
					console.log('Node path set to: ' + value);
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

		new Setting(containerEl)
			.setName('Python path')
			.setDesc('The path to your Python installation.')
			.addText(text => text
				.setValue(this.plugin.settings.pythonPath)
				.onChange(async (value) => {
					this.plugin.settings.pythonPath = value;
					console.log('Python path set to: ' + value);
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
		new Setting(containerEl)
				.setName('Bash path')
				.setDesc('The path to bash.')
				.addText(text => text
					.setValue(this.plugin.settings.bashPath)
					.onChange(async (value) => {
						this.plugin.settings.bashPath = value;
						console.log('Bash path set to: ' + value);
						await this.plugin.saveSettings();
					}));
		new Setting(containerEl)
				.setName('Bash arguments')
				.addText(text => text
					.setValue(this.plugin.settings.bashArgs)
					.onChange(async (value) => {
						this.plugin.settings.bashArgs = value;
						console.log('Bash args set to: ' + value);
						await this.plugin.saveSettings();
					}));
		new Setting(containerEl)
			.setName('Prolog Answer Limit')
			.setDesc('Maximal number of answers to be returned by the Prolog engine. This is to prevent creating too huge texts in the notebook.')
			.addText(text => text
				.setValue("" + this.plugin.settings.maxPrologAnswers)
				.onChange(async (value) => {
					if( Number(value) * 1000){
						console.log('Answer limit set to: ' + value);
						this.plugin.settings.maxPrologAnswers = Number(value);
					}
					await this.plugin.saveSettings();
				}));
	}
}
