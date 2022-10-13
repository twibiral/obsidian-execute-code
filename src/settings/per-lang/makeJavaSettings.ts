import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Java Settings' });
    new Setting(containerEl)
        .setName('Java path (Java 11 or higher)')
        .setDesc('The path to your Java installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.javaPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.javaPath = sanitized;
                console.log('Java path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Java arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.javaArgs)
            .onChange(async (value) => {
                tab.plugin.settings.javaArgs = value;
                console.log('Java args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "java");
}