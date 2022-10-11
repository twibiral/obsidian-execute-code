import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Golang Settings' });
    new Setting(containerEl)
        .setName('Golang Path')
        .setDesc('The path to your Golang installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.golangPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.golangPath = sanitized;
                console.log('Golang path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "go");
}