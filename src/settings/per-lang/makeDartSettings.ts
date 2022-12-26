import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Dart Settings' });
    new Setting(containerEl)
        .setName('dart path')
        .addText(text => text
            .setValue(tab.plugin.settings.dartPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.dartPath = sanitized;
                console.log('dart path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Dart arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.dartArgs)
            .onChange(async (value) => {
                tab.plugin.settings.dartArgs = value;
                console.log('Dart args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "dart");
}
