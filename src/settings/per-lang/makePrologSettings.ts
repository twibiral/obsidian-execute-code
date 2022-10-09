import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Prolog Settings' });
    new Setting(containerEl)
        .setName('Prolog Answer Limit')
        .setDesc('Maximal number of answers to be returned by the Prolog engine. tab is to prevent creating too huge texts in the notebook.')
        .addText(text => text
            .setValue("" + tab.plugin.settings.maxPrologAnswers)
            .onChange(async (value) => {
                if (Number(value) * 1000) {
                    console.log('Prolog answer limit set to: ' + value);
                    tab.plugin.settings.maxPrologAnswers = Number(value);
                }
                await tab.plugin.saveSettings();
            }));
    tab.makeInjectSetting(containerEl, "prolog", "Prolog");
}