import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Powershell Settings' });
    new Setting(containerEl)
        .setName('Powershell path')
        .setDesc('The path to Powershell.')
        .addText(text => text
            .setValue(tab.plugin.settings.powershellPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.powershellPath = sanitized;
                console.log('Powershell path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Shell arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.powershellArgs)
            .onChange(async (value) => {
                tab.plugin.settings.powershellArgs = value;
                console.log('Powershell args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Shell file extension')
        .setDesc('Changes the file extension for generated shell scripts. This is useful if you want to use a shell other than bash.')
        .addText(text => text
            .setValue(tab.plugin.settings.powershellFileExtension)
            .onChange(async (value) => {
                tab.plugin.settings.powershellFileExtension = value;
                console.log('Powershell file extension set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "powershell");
}