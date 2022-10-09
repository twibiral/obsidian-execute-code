import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'C++ Settings' });
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
        .setName('Cling arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.clingArgs)
            .onChange(async (value) => {
                tab.plugin.settings.clingArgs = value;
                console.log('Cling args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Cling std')
        .addDropdown(dropdown => dropdown
            .addOption('c++11', 'C++ 11')
            .addOption('c++14', 'C++ 14')
            .addOption('c++17', 'C++ 17')
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
            .setValue(tab.plugin.settings.cppUseMain)
            .onChange(async (value) => {
                tab.plugin.settings.cppUseMain = value;
                console.log('Cpp use main set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting("cpp", "C++");
}