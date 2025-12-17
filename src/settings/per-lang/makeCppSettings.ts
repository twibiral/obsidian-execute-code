import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'C++ Settings' });
    new Setting(containerEl)
        .setName('g++ path')
        .setDesc('The path to your g++ installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.gppPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.gppPath = sanitized;
                console.log('g++ path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('g++ arguments for C++')
        .addText(text => text
            .setValue(tab.plugin.settings.cppArgs)
            .onChange(async (value) => {
                tab.plugin.settings.cppArgs = value;
                console.log('CPP args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('g++ std')
        .addDropdown(dropdown => dropdown
            .addOption('c++98', 'C++ 98')
            .addOption('c++11', 'C++ 11')
            .addOption('c++14', 'C++ 14')
            .addOption('c++17', 'C++ 17')
            .addOption('c++2a', 'C++ 20')
            .addOption('c++23', 'C++ 23')
            .setValue(tab.plugin.settings.gppStd)
            .onChange(async (value) => {
                tab.plugin.settings.gppStd = value;
                console.log('g++ std set to: ' + value);
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
    tab.makeInjectSetting(containerEl, "cpp");
}
