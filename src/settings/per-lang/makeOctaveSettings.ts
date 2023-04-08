import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Octave Settings' });
    new Setting(containerEl)
        .setName('Octave path')
        .setDesc('The path to your Octave installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.octavePath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.octavePath = sanitized;
                console.log('Octave path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Octave arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.octaveArgs)
            .onChange(async (value) => {
                tab.plugin.settings.octaveArgs = value;
                console.log('Octave args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "octave");
}
