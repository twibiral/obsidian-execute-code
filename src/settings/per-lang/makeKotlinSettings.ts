import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Kotlin Settings' });
    new Setting(containerEl)
        .setName('Kotlin path')
        .setDesc('The path to your Kotlin installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.kotlinPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.kotlinPath = sanitized;
                console.log('Kotlin path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Kotlin arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.kotlinArgs)
            .onChange(async (value) => {
                tab.plugin.settings.kotlinArgs = value;
                console.log('Kotlin args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "kotlin");
}