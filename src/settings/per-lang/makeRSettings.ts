import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'R Settings' });
    new Setting(containerEl)
        .setName('Embed R Plots created via `plot()` into Notes')
        .addToggle(toggle => toggle
            .setValue(tab.plugin.settings.REmbedPlots)
            .onChange(async (value) => {
                tab.plugin.settings.REmbedPlots = value;
                console.log(value ? 'Embedding R Plots into Notes.' : "Not embedding R Plots into Notes.");
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Rscript path')
        .setDesc('The path to your Rscript installation. Ensure you provide the Rscript binary instead of the ordinary R binary.')
        .addText(text => text
            .setValue(tab.plugin.settings.RPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.RPath = sanitized;
                console.log('R path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('R arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.RArgs)
            .onChange(async (value) => {
                tab.plugin.settings.RArgs = value;
                console.log('R args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName("Run R blocks in Notebook Mode")
        .addToggle((toggle) => toggle
            .setValue(tab.plugin.settings.rInteractive)
            .onChange(async (value) => {
                tab.plugin.settings.rInteractive = value;
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "r");
}