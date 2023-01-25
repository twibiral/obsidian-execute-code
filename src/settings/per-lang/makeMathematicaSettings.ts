import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Wolfram Mathematica Settings' });
    new Setting(containerEl)
        .setName('Mathematica path')
        .setDesc('The path to your Mathematica installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.mathematicaPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.mathematicaPath = sanitized;
                console.log('Mathematica path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Mathematica arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.mathematicaArgs)
            .onChange(async (value) => {
                tab.plugin.settings.mathematicaArgs = value;
                console.log('Mathematica args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "mathematica");
}