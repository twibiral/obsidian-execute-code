import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Batch Settings' });
    new Setting(containerEl)
        .setName('Batch path')
        .setDesc('The path to the terminal. Default is command prompt.')
        .addText(text => text
            .setValue(tab.plugin.settings.batchPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.batchPath = sanitized;
                console.log('Batch path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Batch arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.batchArgs)
            .onChange(async (value) => {
                tab.plugin.settings.batchArgs = value;
                console.log('Batch args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Batch file extension')
        .setDesc('Changes the file extension for generated batch scripts. Default is .bat')
        .addText(text => text
            .setValue(tab.plugin.settings.batchFileExtension)
            .onChange(async (value) => {
                tab.plugin.settings.batchFileExtension = value;
                console.log('Batch file extension set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "batch");
}
