import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Lean Settings' });
    new Setting(containerEl)
        .setName('lean path')
        .addText(text => text
            .setValue(tab.plugin.settings.leanPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.leanPath = sanitized;
                console.log('lean path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Lean arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.leanArgs)
            .onChange(async (value) => {
                tab.plugin.settings.leanArgs = value;
                console.log('Lean args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "lean");
}
