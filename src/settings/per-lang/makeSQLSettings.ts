import {Setting} from "obsidian";
import {SettingsTab} from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
	containerEl.createEl('h3', {text: 'SQL Settings'});
	new Setting(containerEl)
		.setName('SQL path')
		.setDesc("Path to your SQL installation. You can select the SQL dialect you prefer but you need to set the right arguments by yourself.")
		.addText(text => text
			.setValue(tab.plugin.settings.sqlPath)
			.onChange(async (value) => {
				const sanitized = tab.sanitizePath(value);
				tab.plugin.settings.sqlPath = sanitized;
				console.log('ruby path set to: ' + sanitized);
				await tab.plugin.saveSettings();
			}));
	new Setting(containerEl)
		.setName('SQL arguments')
		.setDesc('Set the right arguments for your database.')
		.addText(text => text
			.setValue(tab.plugin.settings.sqlArgs)
			.onChange(async (value) => {
				tab.plugin.settings.sqlArgs = value;
				console.log('SQL args set to: ' + value);
				await tab.plugin.saveSettings();
			}));
	tab.makeInjectSetting(containerEl, "sql");
}
