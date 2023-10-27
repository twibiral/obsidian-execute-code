import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Zig Settings' });
    new Setting(containerEl)
        .setName('zig path')
        .setDesc("Path to your zig installation")
        .addText(text => text
            .setValue(tab.plugin.settings.zigPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.zigPath = sanitized;
                console.log('zig path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('zig arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.zigArgs)
            .onChange(async (value) => {
                tab.plugin.settings.zigArgs = value;
                console.log('zig args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "zig");
}
