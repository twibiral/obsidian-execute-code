import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Racket Settings' });
    new Setting(containerEl)
        .setName('racket path')
        .setDesc("Path to your racket installation")
        .addText(text => text
            .setValue(tab.plugin.settings.racketPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.racketPath = sanitized;
                console.log('racket path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Racket arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.racketArgs)
            .onChange(async (value) => {
                tab.plugin.settings.racketArgs = value;
                console.log('Racket args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "racket");
}
