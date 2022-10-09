import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Lua Settings' });
    new Setting(containerEl)
        .setName('lua path')
        .addText(text => text
            .setValue(tab.plugin.settings.luaPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.luaPath = sanitized;
                console.log('lua path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Lua arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.luaArgs)
            .onChange(async (value) => {
                tab.plugin.settings.luaArgs = value;
                console.log('Lua args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting("lua", "Lua");
}