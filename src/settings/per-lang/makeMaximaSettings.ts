import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Maxima Settings' });
    new Setting(containerEl)
        .setName('Maxima path')
        .setDesc('The path to your Maxima installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.maximaPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.maximaPath = sanitized;
                console.log('Maxima path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Maxima arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.maximaArgs)
            .onChange(async (value) => {
                tab.plugin.settings.maximaArgs = value;
                console.log('Maxima args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "maxima");
}
