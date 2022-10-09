import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Rust Settings' });
    new Setting(containerEl)
        .setName('Cargo Path')
        .setDesc('The path to your Cargo installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.cargoPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.cargoPath = sanitized;
                console.log('Cargo path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting("rust", "Rust");
}