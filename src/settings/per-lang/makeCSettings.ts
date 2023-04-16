import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'C Settings' });
    new Setting(containerEl)
        .setName('Cling path')
        .setDesc('The path to your Cling installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.clingPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.clingPath = sanitized;
                console.log('Cling path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Cling arguments for C')
        .addText(text => text
            .setValue(tab.plugin.settings.cArgs)
            .onChange(async (value) => {
                tab.plugin.settings.cArgs = value;
                console.log('Cling args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Cling std')
        .addDropdown(dropdown => dropdown
			.addOption('c++98', 'C++ 98')
            .addOption('c++11', 'C++ 11')
            .addOption('c++14', 'C++ 14')
            .addOption('c++17', 'C++ 17')
            .addOption('c++2a', 'C++ 20')
            .setValue(tab.plugin.settings.clingStd)
            .onChange(async (value) => {
                tab.plugin.settings.clingStd = value;
                console.log('Cling std set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Use main function')
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
