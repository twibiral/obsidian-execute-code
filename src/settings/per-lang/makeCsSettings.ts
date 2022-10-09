import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'CSharp Settings' });
    new Setting(containerEl)
        .setName('dotnet path')
        .addText(text => text
            .setValue(tab.plugin.settings.csPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.csPath = sanitized;
                console.log('dotnet path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('CSharp arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.csArgs)
            .onChange(async (value) => {
                tab.plugin.settings.csArgs = value;
                console.log('CSharp args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "cs", "CSharp");
}