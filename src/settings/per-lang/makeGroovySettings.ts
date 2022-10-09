import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Groovy Settings' });
    new Setting(containerEl)
        .setName('Groovy path')
        .setDesc('The path to your Groovy installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.groovyPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.groovyPath = sanitized;
                console.log('Groovy path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Groovy arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.groovyArgs)
            .onChange(async (value) => {
                tab.plugin.settings.groovyArgs = value;
                console.log('Groovy args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "groovy", "Groovy");
}