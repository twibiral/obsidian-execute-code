import {Notice, Setting} from "obsidian";
import { SettingsTab } from "../SettingsTab";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    containerEl.createEl('h3', { text: 'Powershell Settings' });
    new Setting(containerEl)
        .setName('Powershell path')
        .setDesc('The path to Powershell.')
        .addText(text => text
            .setValue(tab.plugin.settings.powershellPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                tab.plugin.settings.powershellPath = sanitized;
                console.log('Powershell path set to: ' + sanitized);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Powershell arguments')
        .addText(text => text
            .setValue(tab.plugin.settings.powershellArgs)
            .onChange(async (value) => {
                tab.plugin.settings.powershellArgs = value;
                console.log('Powershell args set to: ' + value);
                await tab.plugin.saveSettings();
            }));
    new Setting(containerEl)
        .setName('Powershell file extension')
        .setDesc('Changes the file extension for generated shell scripts. This is useful if you don\'t want to use PowerShell.')
        .addText(text => text
            .setValue(tab.plugin.settings.powershellFileExtension)
            .onChange(async (value) => {
                tab.plugin.settings.powershellFileExtension = value;
                console.log('Powershell file extension set to: ' + value);
                await tab.plugin.saveSettings();
            }));
	new Setting(containerEl)
        .setName('PowerShell script encoding')
        .setDesc('Windows still uses windows-1252 as default encoding on most systems for legacy reasons. If you change your encodings systemwide' +
			' to UTF-8, you can change this setting to UTF-8 as well. Only use one of the following encodings: ' +
			'"ascii", "utf8", "utf-8", "utf16le", "ucs2", "ucs-2", "base64", "latin1", "binary", "hex" (default: "latin1")')
        .addText(text => text
            .setValue(tab.plugin.settings.powershellEncoding)
            .onChange(async (value) => {
				value = value.replace(/["'`´]/, "").trim().toLowerCase();
				if (["ascii", "utf8", "utf-8", "utf16le", "ucs2", "ucs-2", "base64", "latin1", "binary", "hex"].includes(value)) {
					tab.plugin.settings.powershellEncoding = value as BufferEncoding;
					console.log('Powershell file extension set to: ' + value);
					await tab.plugin.saveSettings();
				} else {
					console.error("Invalid encoding. " + value + "Please use one of the following encodings: " +
						'"ascii", "utf8", "utf-8", "utf16le", "ucs2", "ucs-2", "base64", "latin1", "binary", "hex"');
				}
            }));
    tab.makeInjectSetting(containerEl, "powershell");
}
