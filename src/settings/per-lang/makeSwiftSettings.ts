import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Swift Settings' });
    new Setting(containerEl)
        .setName('Swift path')
        .setDesc('The path to your Swift installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.swiftPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.swiftPath = sanitized;
                console.log('Swift path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Swift arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.swiftArgs)
            .onChange(async (value) => {
                tab.plugin.settings.swiftArgs = value;
                console.log('Swift args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "swift");
}