import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Tcl Settings' });
    new Setting(containerEl)
        .setName('tclsh path')
        .setDesc('Path to the tclsh interpreter (e.g. "tclsh" or "C:/ActiveTcl/bin/tclsh.exe" on Windows)')
        .addText(text => text
            .setValue(tab.plugin.settings.tclPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.tclPath = sanitized;
                console.log('tcl path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Tcl arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.tclArgs)
            .onChange(async (value) => {
                tab.plugin.settings.tclArgs = value;
                console.log('Tcl args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "tcl");
}
