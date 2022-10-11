import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Shell Settings' });
    new Setting(containerEl)
        .setName('Shell path')
        .setDesc('The path to shell. Default is Bash but you can use any shell you want, e.g. bash, zsh, fish, ...')
        .addText(text => text
            .setValue(tab.plugin.settings.shellPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.shellPath = sanitized;
                console.log('Shell path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Shell arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.shellArgs)
            .onChange(async (value) => {
                tab.plugin.settings.shellArgs = value;
                console.log('Shell args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Shell file extension')
        .setDesc('Changes the file extension for generated shell scripts. This is useful if you want to use a shell other than bash.')
        .addText(text => text
            .setValue(tab.plugin.settings.shellFileExtension)
            .onChange(async (value) => {
                tab.plugin.settings.shellFileExtension = value;
                console.log('Shell file extension set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "shell");
}