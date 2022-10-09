import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Python Settings' });
    new Setting(containerEl)
        .setName('Embed Python Plots')
        .addToggle(toggle => toggle
            .setValue(tab.plugin.settings.pythonEmbedPlots)
            .onChange(async (value) => {
                tab.plugin.settings.pythonEmbedPlots = value;
                console.log(value ? 'Embedding Plots into Notes.' : "Not embedding Plots into Notes.");
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Python path')
        .setDesc('The path to your Python installation.')
        .addText(text => text
            .setValue(tab.plugin.settings.pythonPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.pythonPath = sanitized;
                console.log('Python path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Python arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.pythonArgs)
            .onChange(async (value) => {
                tab.plugin.settings.pythonArgs = value;
                console.log('Python args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName("Run Python blocks in Notebook Mode")
        .addToggle((toggle) => toggle
            .setValue(tab.plugin.settings.pythonInteractive)
            .onChange(async (value) => {
                tab.plugin.settings.pythonInteractive = value;
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting("python", "Python");
}