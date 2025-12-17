import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'C Settings' });
    new Setting(containerEl)
        .setName('gcc path')
        .setDesc('The path to your gcc installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.gppPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.gppPath = sanitized;
                console.log('gcc path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('gcc arguments for C')
        .addText(text => text
            .setValue(tab.plugin.settings.cArgs)
            .onChange(async (value) => {
                tab.plugin.settings.cArgs = value;
                console.log('gcc args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('gpp std (ignored for gcc)')
        .addDropdown(dropdown => dropdown
            .addOption('c++98', 'C++ 98')
            .addOption('c++11', 'C++ 11')
            .addOption('c++14', 'C++ 14')
            .addOption('c++17', 'C++ 17')
            .addOption('c++2a', 'C++ 20')
            .setValue(tab.plugin.settings.gppStd)
            .onChange(async (value) => {
                tab.plugin.settings.gppStd = value;
                console.log('gcc std set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Use main function (mandatory for gcc)')
        .setDesc('If enabled, will use a main() function as the code block entrypoint.')
        .addToggle((toggle) => toggle
            .setValue(tab.plugin.settings.cUseMain)
            .onChange(async (value) => {
                tab.plugin.settings.cUseMain = value;
                console.log('C use main set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "c");
}
