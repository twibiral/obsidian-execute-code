import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'PHP Settings' });
    new Setting(containerEl)
        .setName('php path')
        .setDesc("Path to your php installation")
        .addText(text => text
            .setValue(tab.plugin.settings.phpPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.phpPath = sanitized;
                console.log('php path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('php arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.phpArgs)
            .onChange(async (value) => {
                tab.plugin.settings.phpArgs = value;
                console.log('php args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "php");
}
