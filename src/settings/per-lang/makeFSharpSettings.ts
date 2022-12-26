import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'F# Settings' });
    new Setting(containerEl)
        .setName('F# path')
        .setDesc('The path to dotnet.')
        .addText(text => text
            .setValue(tab.plugin.settings.fsharpPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.fsharpPath = sanitized;
                console.log('F# path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('F# arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.fsharpArgs)
            .onChange(async (value) => {
                tab.plugin.settings.fsharpArgs = value;
                console.log('F# args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('F# file extension')
        .setDesc('Changes the file extension for generated F# scripts.')
        .addText(text => text
            .setValue(tab.plugin.settings.fsharpFileExtension)
            .onChange(async (value) => {
                tab.plugin.settings.fsharpFileExtension = value;
                console.log('F# file extension set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "fsharp");
}