import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Applescript Settings' });
    new Setting(containerEl)
        .setName('Applescript path')
        .setDesc('The path to your Applescript installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.applescriptPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.applescriptPath = sanitized;
                console.log('Applescript path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Applescript arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.applescriptArgs)
            .onChange(async (value) => {
                tab.plugin.settings.applescriptArgs = value;
                console.log('Applescript args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "applescript");
}
