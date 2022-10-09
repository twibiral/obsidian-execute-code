import {App, PluginSettingTab, Setting} from "obsidian";
import ExecuteCodePlugin, {LanguageId} from "src/main";
import makeCppSettings from "./per-lang/makeCppSettings";
import makeCsSettings from "./per-lang/makeCsSettings";
import makeGoSettings from "./per-lang/makeGoSettings";
import makeGroovySettings from "./per-lang/makeGroovySettings";
import makeHaskellSettings from "./per-lang/makeHaskellSettings";
import makeJavaSettings from "./per-lang/makeJavaSettings";
import makeJsSettings from "./per-lang/makeJsSettings";
import makeKotlinSettings from "./per-lang/makeKotlinSettings";
import makeLuaSettings from "./per-lang/makeLuaSettings";
import makeMathematicaSettings from "./per-lang/makeMathematicaSettings";
import makePowershellSettings from "./per-lang/makePowershellSettings";
import makePrologSettings from "./per-lang/makePrologSettings";
import makePythonSettings from "./per-lang/makePythonSettings";
import makeRSettings from "./per-lang/makeRSettings";
import makeRustSettings from "./per-lang/makeRustSettings";
import makeShellSettings from "./per-lang/makeShellSettings";
import makeTsSettings from "./per-lang/makeTsSettings";
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
		makeJsSettings(this, containerEl);

		// ========== TypeScript ==========
		makeTsSettings(this, containerEl);

		// ========== Lua ==========
		makeLuaSettings(this, containerEl);

		// ========== CSharp ==========
		makeCsSettings(this, containerEl);

		// ========== Java ==========
		makeJavaSettings(this, containerEl);


		// ========== Python ==========
		makePythonSettings(this, containerEl);


		// ========== Golang =========
		makeGoSettings(this, containerEl);


		// ========== Rust ===========
		makeRustSettings(this, containerEl);


		// ========== C++ ===========
		makeCppSettings(this, containerEl);


		// ========== Shell ==========
		makeShellSettings(this, containerEl);


		// ========== Powershell ==========
		makePowershellSettings(this, containerEl);


		// ========== Prolog ==========
		makePrologSettings(this, containerEl);


		// ========== Groovy ==========
		makeGroovySettings(this, containerEl);


		// ========== R ==========
		makeRSettings(this, containerEl);


		// ========== Kotlin ==========
		makeKotlinSettings(this, containerEl);

		// ========== Mathematica ==========
		makeMathematicaSettings(this, containerEl);


		// ========== Haskell ===========
		makeHaskellSettings(this, containerEl);
	}

	sanitizePath(path: string): string {
		path = path.replace(/\\/g, '/');
		path = path.replace(/['"`]/, '');
		path = path.trim();

		return path
	}

	makeInjectSetting(language: LanguageId, languageAlt: string) {
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
