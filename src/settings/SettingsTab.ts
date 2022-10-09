import {App, PluginSettingTab, Setting} from "obsidian";
import ExecuteCodePlugin, {LanguageId} from "src/main";
import {ExecutorSettings} from "./Settings";


/**
 * This class is responsible for creating a settings tab in the settings menu. The settings tab is showed in the
 * regular obsidian settings menu.
 *
 * The {@link display} functions build the html page that is showed in the settings.
 */
export class SettingsTab extends PluginSettingTab {
	plugin: ExecuteCodePlugin;

	constructor(app: App, plugin: ExecuteCodePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 *  Builds the html page that is showed in the settings.
	 */
	display() {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for the Code Execution Plugin.'});


		// ========== General ==========
		containerEl.createEl('h3', {text: 'General Settings'});
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
		new Setting(containerEl)
			.setName('Allow Input')
			.setDesc('Whether or not to include a stdin input box when running blocks. In order to apply changes to this, Obsidian must be refreshed. ')
			.addToggle(text => text
				.setValue(this.plugin.settings.allowInput)
				.onChange(async (value) => {
					console.log('Allow Input set to: ' + value);
					this.plugin.settings.allowInput = value
					await this.plugin.saveSettings();
				}));

		// TODO setting per language that requires main function if main function should be implicitly made or not, if not, non-main blocks will not have a run button


		// ========== JavaScript / Node ==========
		containerEl.createEl('h3', {text: 'JavaScript / Node Settings'});
		new Setting(containerEl)
			.setName('Node path')
			.addText(text => text
				.setValue(this.plugin.settings.nodePath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
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
		new Setting(containerEl)
			.setName("Run Javascript blocks in Notebook Mode")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.jsInteractive)
				.onChange(async (value) => {
					this.plugin.settings.jsInteractive = value;
					await this.plugin.saveSettings();
				})
			)
		this.makeInjectSetting("js", "JavaScript");

		// ========== TypeScript ==========
		containerEl.createEl('h3', {text: 'TypeScript Settings'});
		new Setting(containerEl)
			.setName('ts-node path')
			.addText(text => text
				.setValue(this.plugin.settings.tsPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
					this.plugin.settings.tsPath = sanitized;
					console.log('ts-node path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('TypeScript arguments')
			.addText(text => text
				.setValue(this.plugin.settings.tsArgs)
				.onChange(async (value) => {
					this.plugin.settings.tsArgs = value;
					console.log('TypeScript args set to: ' + value);
					await this.plugin.saveSettings();
				}));
		this.makeInjectSetting("ts", "TypeScript");

		// ========== Lua ==========
		containerEl.createEl('h3', {text: 'Lua Settings'});
		new Setting(containerEl)
			.setName('lua path')
			.addText(text => text
				.setValue(this.plugin.settings.luaPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
					this.plugin.settings.luaPath = sanitized;
					console.log('lua path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Lua arguments')
			.addText(text => text
				.setValue(this.plugin.settings.luaArgs)
				.onChange(async (value) => {
					this.plugin.settings.luaArgs = value;
					console.log('Lua args set to: ' + value);
					await this.plugin.saveSettings();
				}));
		this.makeInjectSetting("lua", "Lua");

		// ========== CSharp ==========
		containerEl.createEl('h3', {text: 'CSharp Settings'});
		new Setting(containerEl)
			.setName('dotnet path')
			.addText(text => text
				.setValue(this.plugin.settings.csPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
					this.plugin.settings.csPath = sanitized;
					console.log('dotnet path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('CSharp arguments')
			.addText(text => text
				.setValue(this.plugin.settings.csArgs)
				.onChange(async (value) => {
					this.plugin.settings.csArgs = value;
					console.log('CSharp args set to: ' + value);
					await this.plugin.saveSettings();
				}));
		this.makeInjectSetting("cs", "CSharp");

		// ========== Java ==========
		containerEl.createEl('h3', {text: 'Java Settings'});
		new Setting(containerEl)
			.setName('Java path (Java 11 or higher)')
			.setDesc('The path to your Java installation.')
			.addText(text => text
				.setValue(this.plugin.settings.javaPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
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
		this.makeInjectSetting("java", "Java");


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
					const sanitized = this.sanitizePath(value);
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
		new Setting(containerEl)
			.setName("Run Python blocks in Notebook Mode")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.pythonInteractive)
				.onChange(async (value) => {
					this.plugin.settings.pythonInteractive = value;
					await this.plugin.saveSettings();
				}));
		this.makeInjectSetting("python", "Python");


		// ========== Golang =========
		containerEl.createEl('h3', {text: 'Golang Settings'});
		new Setting(containerEl)
			.setName('Golang Path')
			.setDesc('The path to your Golang installation.')
			.addText(text => text
				.setValue(this.plugin.settings.golangPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
					this.plugin.settings.golangPath = sanitized;
					console.log('Golang path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		this.makeInjectSetting("go", "Golang");


		// ========== Rust ===========
		containerEl.createEl('h3', {text: 'Rust Settings'});
		new Setting(containerEl)
			.setName('Cargo Path')
			.setDesc('The path to your Cargo installation.')
			.addText(text => text
				.setValue(this.plugin.settings.cargoPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
					this.plugin.settings.cargoPath = sanitized;
					console.log('Cargo path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		this.makeInjectSetting("rust", "Rust");


		// ========== C++ ===========
		containerEl.createEl('h3', {text: 'C++ Settings'});
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
		new Setting(containerEl)
			.setName('Use main function')
			.setDesc('If enabled, will use a main() function as the code block entrypoint.')
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.cppUseMain)
				.onChange(async (value) => {
					this.plugin.settings.cppUseMain = value;
					console.log('Cpp use main set to: ' + value);
					await this.plugin.saveSettings();
				}));
		this.makeInjectSetting("cpp", "C++");


		// ========== Shell ==========
		containerEl.createEl('h3', {text: 'Shell Settings'});
		new Setting(containerEl)
			.setName('Shell path')
			.setDesc('The path to shell. Default is Bash but you can use any shell you want, e.g. bash, zsh, fish, ...')
			.addText(text => text
				.setValue(this.plugin.settings.shellPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
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
		this.makeInjectSetting("shell", "Shell");


		// ========== Powershell ==========
		containerEl.createEl('h3', {text: 'Powershell Settings'});
		new Setting(containerEl)
			.setName('Powershell path')
			.setDesc('The path to Powershell.')
			.addText(text => text
				.setValue(this.plugin.settings.powershellPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
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
		this.makeInjectSetting("powershell", "Powershell");


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
		this.makeInjectSetting("prolog", "Prolog");


		// ========== Groovy ==========
		containerEl.createEl('h3', {text: 'Groovy Settings'});
		new Setting(containerEl)
			.setName('Groovy path')
			.setDesc('The path to your Groovy installation.')
			.addText(text => text
				.setValue(this.plugin.settings.groovyPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
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
		this.makeInjectSetting("groovy", "Groovy");


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
			.setName('Rscript path')
			.setDesc('The path to your Rscript installation. Ensure you provide the Rscript binary instead of the ordinary R binary.')
			.addText(text => text
				.setValue(this.plugin.settings.RPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
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
		this.makeInjectSetting("r", "R");


		// ========== Kotlin ==========
		containerEl.createEl('h3', {text: 'Kotlin Settings'});
		new Setting(containerEl)
			.setName('Kotlin path')
			.setDesc('The path to your Kotlin installation.')
			.addText(text => text
				.setValue(this.plugin.settings.kotlinPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
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
		this.makeInjectSetting("kotlin", "Kotlin");

		// ========== Mathematica ==========
		containerEl.createEl('h3', {text: 'Wolfram Mathematica Settings'});
		new Setting(containerEl)
			.setName('Mathematica path')
			.setDesc('The path to your Mathematica installation.')
			.addText(text => text
				.setValue(this.plugin.settings.kotlinPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
					this.plugin.settings.mathematicaPath = sanitized;
					console.log('Mathematica path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Mathematica arguments')
			.addText(text => text
				.setValue(this.plugin.settings.kotlinArgs)
				.onChange(async (value) => {
					this.plugin.settings.mathematicaArgs = value;
					console.log('Kotlin args set to: ' + value);
					await this.plugin.saveSettings();
				}));
		this.makeInjectSetting("mathematica", "Mathematica");


		// ========== Haskell ===========
		containerEl.createEl('h3', {text: 'Haskell Settings'});
		new Setting(containerEl)
			.setName('Use Ghci')
			.setDesc('Run haskell code with ghci instead of runghc')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useGhci)
				.onChange(async (value) => {
					this.plugin.settings.useGhci = value;
					console.log(value ? 'Now using ghci for haskell' : "Now using runghc for haskell.");
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Ghci path')
			.setDesc('The path to your ghci installation.')
			.addText(text => text
				.setValue(this.plugin.settings.ghciPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
					this.plugin.settings.ghciPath = sanitized;
					console.log('ghci path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Rungch path')
			.setDesc('The path to your runghc installation.')
			.addText(text => text
				.setValue(this.plugin.settings.runghcPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
					this.plugin.settings.runghcPath = sanitized;
					console.log('runghc path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Ghc path')
			.setDesc('The Ghc path your runghc installation will call.')
			.addText(text => text
				.setValue(this.plugin.settings.ghcPath)
				.onChange(async (value) => {
					const sanitized = this.sanitizePath(value);
					this.plugin.settings.ghcPath = sanitized;
					console.log('ghc path set to: ' + sanitized);
					await this.plugin.saveSettings();
				}));
		this.makeInjectSetting("haskell", "Haskell");
	}

	private sanitizePath(path: string): string {
		path = path.replace(/\\/g, '/');
		path = path.replace(/['"`]/, '');
		path = path.trim();

		return path
	}

	private makeInjectSetting(language: LanguageId, languageAlt: string) {
		new Setting(this.containerEl)
			.setName(`Inject ${languageAlt} code`)
			.setDesc(`Code to add to the top of every ${languageAlt} code block before running.`)
			.setClass('settings-code-input-box')
			.addTextArea(textarea => {
				// @ts-ignore
				const val = this.plugin.settings[`${language}Inject` as keyof ExecutorSettings as string]
				return textarea
					.setValue(val)
					.onChange(async (value) => {
						(this.plugin.settings[`${language}Inject` as keyof ExecutorSettings] as string) = value;
						console.log(`${language} inject set to ${value}`);
						await this.plugin.saveSettings();
					});
			});
	}
}
