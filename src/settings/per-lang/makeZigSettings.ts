import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Zig Settings' });
    new Setting(containerEl)
        .setName('Zig path')
        .setDesc('The path to your Zig installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.zigPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.zigPath = sanitized;
                console.log('Zig path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Zig arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.zigArgs)
            .onChange(async (value) => {
                tab.plugin.settings.zigArgs = value;
                console.log('Zig args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "zig");
}