import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'TypeScript Settings' });
    new Setting(containerEl)
        .setName('ts-node path')
        .addText(text => text
            .setValue(tab.plugin.settings.tsPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.tsPath = sanitized;
                console.log('ts-node path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('TypeScript arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.tsArgs)
            .onChange(async (value) => {
                tab.plugin.settings.tsArgs = value;
                console.log('TypeScript args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "ts", "TypeScript");
}