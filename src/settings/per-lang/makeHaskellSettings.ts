import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Haskell Settings' });
    new Setting(containerEl)
        .setName('Ghci path')
        .setDesc('The path to your Ghci installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.ghciPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.ghciPath = sanitized;
                console.log('Ghci path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Ghci arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.ghciArgs)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.ghciArgs = sanitized;
                console.log('Ghci args set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "haskell", "Haskell");
}