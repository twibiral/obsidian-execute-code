import {Setting} from "obsidian";
import {SettingsTab} from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
	containerEl.createEl('h3', {text: 'Haskell Settings'});
	new Setting(containerEl)
		.setName('Use Ghci')
		.setDesc('Run haskell code with ghci instead of runghc')
		.addToggle(toggle => toggle
			.setValue(tab.plugin.settings.useGhci)
			.onChange(async (value) => {
				tab.plugin.settings.useGhci = value;
				console.log(value ? 'Now using ghci for haskell' : "Now using runghc for haskell.");
				await tab.plugin.saveSettings();
			}));
	new Setting(containerEl)
		.setName('Ghci path')
		.setDesc('The path to your ghci installation.')
		.addText(text => text
			.setValue(tab.plugin.settings.ghciPath)
			.onChange(async (value) => {
				const sanitized = tab.sanitizePath(value);
				tab.plugin.settings.ghciPath = sanitized;
				console.log('ghci path set to: ' + sanitized);
				await tab.plugin.saveSettings();
			}));
	new Setting(containerEl)
		.setName('Rungch path')
		.setDesc('The path to your runghc installation.')
		.addText(text => text
			.setValue(tab.plugin.settings.runghcPath)
			.onChange(async (value) => {
				const sanitized = tab.sanitizePath(value);
				tab.plugin.settings.runghcPath = sanitized;
				console.log('runghc path set to: ' + sanitized);
				await tab.plugin.saveSettings();
			}));
	new Setting(containerEl)
		.setName('Ghc path')
		.setDesc('The Ghc path your runghc installation will call.')
		.addText(text => text
			.setValue(tab.plugin.settings.ghcPath)
			.onChange(async (value) => {
				const sanitized = tab.sanitizePath(value);
				tab.plugin.settings.ghcPath = sanitized;
				console.log('ghc path set to: ' + sanitized);
				await tab.plugin.saveSettings();
			}));
	tab.makeInjectSetting(containerEl, "haskell");
}
