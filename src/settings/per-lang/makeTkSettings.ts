import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Tk Settings' });
    new Setting(containerEl)
        .setName('wish path')
        .setDesc('Path to the wish interpreter, required for GUI code blocks (e.g. "wish" or "C:/ActiveTcl/bin/wish.exe" on Windows)')
        .addText(text => text
            .setValue(tab.plugin.settings.tkPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.tkPath = sanitized;
                console.log('tk path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Tk arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.tkArgs)
            .onChange(async (value) => {
                tab.plugin.settings.tkArgs = value;
                console.log('Tk args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "tk");
}
