import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'OCaml Settings' });
    new Setting(containerEl)
        .setName('ocaml path')
        .setDesc("Path to your ocaml installation")
        .addText(text => text
            .setValue(tab.plugin.settings.ocamlPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.ocamlPath = sanitized;
                console.log('ocaml path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('ocaml arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.ocamlArgs)
            .onChange(async (value) => {
                tab.plugin.settings.ocamlArgs = value;
                console.log('ocaml args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "ocaml");
}
