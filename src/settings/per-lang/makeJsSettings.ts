import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'JavaScript / Node Settings' });
    new Setting(containerEl)
        .setName('Node path')
        .addText(text => text
            .setValue(tab.plugin.settings.nodePath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.nodePath = sanitized;
                console.log('Node path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Node arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.nodeArgs)
            .onChange(async (value) => {
                tab.plugin.settings.nodeArgs = value;
                console.log('Node args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName("Run Javascript blocks in Notebook Mode")
        .addToggle((toggle) => toggle
            .setValue(tab.plugin.settings.jsInteractive)
            .onChange(async (value) => {
                tab.plugin.settings.jsInteractive = value;
                await tab.plugin.saveSettings();
            })
        )
    tab.makeInjectSetting("js", "JavaScript");
}