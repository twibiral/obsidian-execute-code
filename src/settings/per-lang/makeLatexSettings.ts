import { Setting } from "obsidian";
import { SettingsTab } from "../SettingsTab";
import { DEFAULT_SETTINGS } from "../Settings";
import { updateBodyClass } from "src/transforms/LatexTransformer";
import { parse } from "src/output/RegExpUtilities";

export default (tab: SettingsTab, containerEl: HTMLElement) => {
    const s = tab.plugin.settings;
    const linkTexDistributions = "Distributed through <a href='https://miktex.org/'>MiKTeX</a> or <a href='https://www.tug.org/texlive/'>TeX Live</a>.";
    const linkInkscape = "Download <a href='https://inkscape.org/'>Inkscape</a>.";
    containerEl.createEl('h3', { text: 'LaTeX Settings' });

    containerEl.createEl('h4', { text: 'Code injection' });
    new Setting(containerEl)
        .setName('Default document class')
        .addText(text => text
            .setPlaceholder('disabled')
            .setValue(s.latexDocumentclass)
            .onChange(async (value) => {
                const sanitized = value.trim()
                s.latexDocumentclass = sanitized;
                console.log(`Default documentclass set to: ${sanitized}`);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `Inject ${selectableText('\\documentclass{}')} if no class is specified. The document class macro is always moved to the very top of code blocks.
            Set empty to disable, default is ${selectableText(DEFAULT_SETTINGS.latexDocumentclass, true)}.`;
    new Setting(containerEl)
        .setName('Adopt fonts')
        .addDropdown(dropdown => dropdown
            .addOptions({ '': 'Disabled', system: "Use system default", obsidian: 'Same as Obsidian' })
            .setValue(s.latexAdaptFont)
            .onChange(async (value: typeof s.latexAdaptFont) => {
                s.latexAdaptFont = value;
                console.log(value ? `Now using ${value} fonts.` : 'Now keeping default fonts.');
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `Inject fontspec ${selectableText('\\setmainfont{}')}, ${selectableText('\\setsansfont{}')}, ${selectableText('\\setmonofont{}')} to the top of code blocks. 
            Ignores fonts that can not be loaded by CSS. Skipped if PdfLaTeX is used. Default is ${DEFAULT_SETTINGS.latexAdaptFont === "" ? 'disabled' : DEFAULT_SETTINGS.latexAdaptFont}.`;
    tab.makeInjectSetting(containerEl, "latex");


    containerEl.createEl('h4', { text: 'LaTeX Compiler' });
    new Setting(containerEl)
        .setName('Compiler path')
        .addText(text => text
            .setPlaceholder(`Example: ${DEFAULT_SETTINGS.latexCompilerPath}`)
            .setValue(s.latexCompilerPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                s.latexCompilerPath = sanitized;
                console.log(`latex compiler path set to: ${sanitized}`);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `The path to your LuaLaTeX installation. Or use PdfLaTeX, XeLaTeX. ${linkTexDistributions}`;
    new Setting(containerEl.createDiv())
        .setName('Compiler arguments')
        .addText(text => text
            .setValue(s.latexCompilerArgs)
            .onChange(async (value) => {
                const sanitized = value.trim();
                s.latexCompilerArgs = sanitized;
                console.log(`LaTeX args set to: ${sanitized}`);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `${selectableText('-shell-escape')} Allow LaTeX packages to execute external programs. 
            Default is ${selectableText(DEFAULT_SETTINGS.latexCompilerArgs)}.`;


    containerEl.createEl('h4', { text: 'Post-processing' });
    new Setting(containerEl)
        .setName('Crop to content')
        .addToggle(toggle => toggle
            .setValue(s.latexDoCrop)
            .onChange(async (value) => {
                s.latexDoCrop = value;
                showSubSettings(requiresCrop, value)
                console.log(value ? 'Now cropping pdf to content.' : "Now keeping entire page.");
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `Crop PDF to visible content area with pdfcrop. Default is ${DEFAULT_SETTINGS.latexDoCrop ? 'on' : 'off'}.`;
    const requiresCrop = containerEl.createDiv();
    showSubSettings(requiresCrop, s.latexDoCrop);
    new Setting(requiresCrop.createDiv())
        .setName('Pdfcrop path')
        .addText(text => text
            .setPlaceholder(`Example: ${DEFAULT_SETTINGS.latexCropPath}`)
            .setValue(s.latexCropPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                s.latexCropPath = sanitized;
                console.log(`latex compiler path set to: ${sanitized}`);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `The path to your pdfcrop installation. ${linkTexDistributions}`;
    new Setting(requiresCrop.createDiv())
        .setName('Pdfcrop arguments')
        .addText(text => text
            .setPlaceholder("Example: --margins 10")
            .setValue(s.latexCropArgs)
            .onChange(async (value) => {
                const sanitized = value.trim();
                s.latexCropArgs = sanitized;
                console.log(`LaTeX args set to: ${sanitized}`);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `${selectableText('--margins 10')} Whitespace in all directions. ${selectableText('--margins "left top right bottom"')} Specify margins. 
            Default is ${selectableText(DEFAULT_SETTINGS.latexCropArgs)}.`;
    new Setting(requiresCrop.createDiv())
        .setName('Disable page number')
        .addToggle(toggle => toggle
            .setValue(s.latexCropNoPagenum)
            .onChange(async (value) => {
                s.latexCropNoPagenum = value;
                console.log(value ? 'Now disabling page number for cropping.' : "Now keeping page number for cropping.");
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `Inject ${selectableText('\\pagestyle{empty}')} to reduce the height of the content. 
            Default is ${DEFAULT_SETTINGS.latexCropNoPagenum ? 'on' : 'off'}.`;
    new Setting(requiresCrop.createDiv())
        .setName('Exclude standalone')
        .addToggle(toggle => toggle
            .setValue(s.latexCropNoStandalone)
            .onChange(async (value) => {
                s.latexCropNoStandalone = value;
                console.log(value ? 'Now excluding standalone for cropping.' : "Now including standalone for cropping.");
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `Skip if document class ${selectableText('standalone')} is used, because it is already cropped. 
            Default is ${DEFAULT_SETTINGS.latexCropNoStandalone ? 'on' : 'off'}.`;

    new Setting(containerEl)
        .setName('Save PDF')
        .addToggle(toggle => toggle
            .setValue(s.latexSavePdf)
            .onChange(async (value) => {
                s.latexSavePdf = value;
                console.log(value ? 'Now saving PDFs.' : "Now discarding PDFs.");
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `Save the generated PDF as attachment. Default is ${DEFAULT_SETTINGS.latexSavePdf ? 'on' : 'off'}.`;

    new Setting(containerEl)
        .setName('Convert to SVG')
        .addDropdown(dropdown => dropdown
            .addOptions({ '': 'Disabled', poppler: 'Poppler: draw fonts perfectly', inkscape: 'Inkscape: keep text editable' })
            .setValue(s.latexSaveSvg)
            .onChange(async (value: typeof s.latexSaveSvg) => {
                s.latexSaveSvg = value;
                showSubSettings(requiresSvg, value === 'poppler')
                showSubSettings(requiresInkscape, value === 'inkscape')
                console.log(value === "" ? 'Now discarding SVGs.' : `Svg converter set to: ${value}`);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `Convert the PDF to SVG and save it as attachment. Background is transparant. 
            Default is ${DEFAULT_SETTINGS.latexSaveSvg === "" ? 'disabled' : DEFAULT_SETTINGS.latexSaveSvg}.`;
    const requiresSvg = containerEl.createDiv();
    showSubSettings(requiresSvg, s.latexSaveSvg === 'poppler')
    new Setting(requiresSvg.createDiv())
        .setName('SVG converter path')
        .addText(text => text
            .setPlaceholder(`Example: ${DEFAULT_SETTINGS.latexSvgPath}`)
            .setValue(s.latexSvgPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                s.latexSvgPath = sanitized;
                console.log(`Pdftocairo path for svg set to: ${sanitized}`);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `The path to your pdftocairo installation. ${linkTexDistributions}`;
    new Setting(requiresSvg.createDiv())
        .setName('SVG converter arguments')
        .addText(text => text
            .setValue(s.latexSvgArgs)
            .onChange(async (value) => {
                const sanitized = value.trim();
                s.latexSvgArgs = sanitized;
                console.log(`Pdftocairo args for svg set to: ${sanitized}`);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `Default is ${selectableText(DEFAULT_SETTINGS.latexSvgArgs)}.`;
    const requiresInkscape = containerEl.createDiv();
    showSubSettings(requiresInkscape, s.latexSaveSvg === 'inkscape')
    new Setting(requiresInkscape.createDiv())
        .setName('Inkscape path')
        .addText(text => text
            .setPlaceholder(`Example: ${DEFAULT_SETTINGS.latexInkscapePath}`)
            .setValue(s.latexInkscapePath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                s.latexInkscapePath = sanitized;
                console.log(`latex compiler path set to: ${sanitized}`);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `The path to your Inkscape installation. ${linkInkscape}`;
    new Setting(requiresInkscape.createDiv())
        .setName('Inkscape arguments')
        .addText(text => text
            .setValue(s.latexInkscapeArgs)
            .onChange(async (value) => {
                const sanitized = value.trim();
                s.latexInkscapeArgs = sanitized;
                console.log(`LaTeX args set to: ${sanitized}`);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `${selectableText('--pdf-font-strategy=draw-missing|substitute|keep|…')} How fonts are parsed in the internal PDF importer. 
            Default is ${selectableText(DEFAULT_SETTINGS.latexInkscapeArgs)}.`;

    new Setting(containerEl)
        .setName('Convert to PNG')
        .addToggle(toggle => toggle
            .setValue(s.latexSavePng)
            .onChange(async (value) => {
                s.latexSavePng = value;
                showSubSettings(requiresPng, value)
                console.log(value ? 'Now generation PNGs.' : "Now discarding PNGs.");
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `Convert the PDF to PNG and save it as attachment. Default is ${DEFAULT_SETTINGS.latexSavePng ? 'on' : 'off'}.`;
    const requiresPng = containerEl.createDiv();
    showSubSettings(requiresPng, s.latexSavePng);
    new Setting(requiresPng.createDiv())
        .setName('PNG converter path')
        .addText(text => text
            .setPlaceholder(`Example: ${DEFAULT_SETTINGS.latexPngPath}`)
            .setValue(s.latexPngPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                s.latexPngPath = sanitized;
                console.log(`Pdftocairo args for png set to: ${sanitized}`);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `The path to your pdftocairo installation. ${linkTexDistributions}`;
    new Setting(requiresPng.createDiv())
        .setName('PNG converter arguments')
        .addText(text => text
            .setValue(s.latexPngArgs)
            .onChange(async (value) => {
                const sanitized = value.trim();
                s.latexPngArgs = sanitized;
                console.log(`Pdftocairo args for png set to: ${sanitized}`);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `${selectableText('-transp')} Transparent background. ${selectableText('-gray')} Grayscale. ${selectableText('-mono')} Monochrome. 
            ${selectableText('-f int')} Page to save. Default is ${selectableText(DEFAULT_SETTINGS.latexPngArgs)}.`;

    containerEl.createEl('h4', { text: 'Appearance' });
    new Setting(containerEl)
        .setName('Output embeddings')
        .addToggle(toggle => toggle
            .setValue(s.latexOutputEmbeddings)
            .onChange(async (value) => {
                s.latexOutputEmbeddings = value;
                console.log(value ? 'Now embedding figures.' : `Now linking figures.`)
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `When running a LaTeX code block, show embeddings of saved figures. Default is ${DEFAULT_SETTINGS.latexOutputEmbeddings ? 'on' : 'off'}.`;
    new Setting(containerEl)
        .setName('Center SVGs')
        .addToggle(toggle => toggle
            .setValue(s.latexCenterFigures)
            .onChange(async (value) => {
                s.latexCenterFigures = value;
                console.log(value ? 'Now centering SVGs.' : `Now left aligning SVGs.`)
                updateBodyClass('center-latex-figures', value);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `Horizontally align SVGs whose filename starts with ${selectableText('figure')}. 
            Default is ${DEFAULT_SETTINGS.latexCenterFigures ? 'on' : 'off'}.`;
    new Setting(containerEl)
        .setName('Invert SVGs in dark mode')
        .addToggle(toggle => toggle
            .setValue(s.latexInvertFigures)
            .onChange(async (value) => {
                s.latexInvertFigures = value;
                console.log(value ? 'Now inverting SVGs.' : `Now not inverting SVGs.`)
                updateBodyClass('invert-latex-figures', value);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `If dark mode is enabled, invert the color of SVGs whose filename starts with ${selectableText('figure')}. 
            Default is ${DEFAULT_SETTINGS.latexInvertFigures ? 'on' : 'off'}.`;

    containerEl.createEl('h4', { text: 'Troubleshooting' });
    const maxFigures = containerEl.createDiv();
    new Setting(maxFigures)
        .setName('Keep last n unnamed figures')
        .addText(text => text
            .setPlaceholder('unlimited')
            .setValue(s.latexMaxFigures === Infinity ? "" : `${s.latexMaxFigures}`)
            .onChange(async (value) => {
                const numValue = value === "" ? Infinity : Number(value);
                const isValid = isIntegerOrInfinity(numValue) && numValue > 0;
                updateTextColor(maxFigures, isValid);
                if (isValid) {
                    s.latexMaxFigures = numValue;
                    console.log(`max number of figures set to: ${numValue}`);
                    await tab.plugin.saveSettings();
                }
            }))
        .descEl.innerHTML = `Generated attachments receive an increasing index. To prevent too many files from piling up, jump back to zero after <i>n</i> executions. 
            Set empty for unlimited. Default is ${selectableText(DEFAULT_SETTINGS.latexMaxFigures.toString(), true)}.`;
    maxFigures.querySelector('input').type = "number";
    const captureFigureName = containerEl.createDiv();
    new Setting(captureFigureName)
        .setName('Capture figure name')
        .addText(text => text
            .setPlaceholder('/regex/')
            .setValue(`${s.latexFigureTitlePattern}`)
            .onChange(async (value) => {
                const pattern = parse(value);
                const isValid = pattern != undefined;
                updateTextColor(captureFigureName, isValid);
                if (isValid) {
                    s.latexFigureTitlePattern = pattern.toString();
                    console.log('capture figure name pattern set to: ' + pattern);
                    await tab.plugin.saveSettings();
                }
            }))
        .descEl.innerHTML = `Search LaTeX code block for ${selectableText('\\title{…}')} to retrieve the figure name: 
            ${selectableText(/[^\n][^%`]*/.source)} Ignore comments after % symbol. ${selectableText(/(?<name>.*?)/.source)} Capture group for figure name.
            Default is ${selectableText(DEFAULT_SETTINGS.latexFigureTitlePattern)}.`;
    new Setting(containerEl)
        .setName('Filter output')
        .addToggle(toggle => toggle
            .setValue(s.latexDoFilter)
            .onChange(async (value) => {
                s.latexDoFilter = value;
                showSubSettings(requiresTexfot, value);
                console.log(value ? 'Now filtering latex stdout with texfot.' : 'Now showing full latex stdout.');
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `Filtering stdout to relevant messages with texfot. Default is ${DEFAULT_SETTINGS.latexKeepLog ? 'on' : 'off'}.`
    const requiresTexfot = containerEl.createDiv();
    showSubSettings(requiresTexfot, s.latexDoFilter);
    new Setting(requiresTexfot.createDiv())
        .setName('Texfot path')
        .addText(text => text
            .setPlaceholder(`Example: ${DEFAULT_SETTINGS.latexTexfotPath}`)
            .setValue(s.latexTexfotPath)
            .onChange(async (value) => {
                const sanitized = tab.sanitizePath(value);
                s.latexTexfotPath = sanitized;
                console.log(`texfot path set to: ${sanitized}`);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `The path to your texfot installation. ${linkTexDistributions}`;
    new Setting(requiresTexfot.createDiv())
        .setName('Texfot arguments')
        .addText(text => text
            .setPlaceholder(`Example: ${DEFAULT_SETTINGS.latexTexfotArgs}`)
            .setValue(s.latexTexfotArgs)
            .onChange(async (value) => {
                const sanitized = value.trim();
                s.latexTexfotArgs = sanitized;
                console.log(`texfot arguments set to: ${sanitized}`);
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `${selectableText('--accept regex')}, ${selectableText('--ignore regex')} Filter lines in the TeX output matching RegExp. 
            Default is ${selectableText(DEFAULT_SETTINGS.latexTexfotArgs)}.`;
    new Setting(containerEl)
        .setName('Keep log')
        .addToggle(toggle => toggle
            .setValue(s.latexKeepLog)
            .onChange(async (value) => {
                s.latexKeepLog = value;
                console.log(value ? 'Now preserving latex build folder.' : "Now clearing latex build folder.");
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `Prevent deletion of temporary build folder. Default is ${DEFAULT_SETTINGS.latexKeepLog ? 'on' : 'off'}.`;
    new Setting(containerEl)
        .setName('Run subprocesses in shell')
        .addToggle(toggle => toggle
            .setValue(s.latexSubprocessesUseShell)
            .onChange(async (value) => {
                s.latexSubprocessesUseShell = value;
                console.log(value ? 'Now running subprocesses in shell.' : 'Now running subprocesses directly.');
                await tab.plugin.saveSettings();
            }))
        .descEl.innerHTML = `Run compilation and conversion tools in shell environment. Default is ${DEFAULT_SETTINGS.latexSubprocessesUseShell ? 'on' : 'off'}.`;
}

function showSubSettings(settingsDiv: HTMLDivElement, doShow: boolean) {
    settingsDiv.setAttr('style', doShow ? 'display: block' : 'display: none');
}

function updateTextColor(containerEl: HTMLElement, isValid: boolean) {
    const inputEl = containerEl.querySelector('input') as HTMLInputElement;
    inputEl.style.color = isValid ? '' : 'red';
}

function isIntegerOrInfinity(value: number): boolean {
    return Number.isInteger(value) || value === Infinity;
}

function selectableText(text: string, noMonospace?: boolean) {
    if (noMonospace) return `<span class='selectable-description-text'>${text}</span>`;

    const escapedAngleBrackets = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<span><code class='selectable-description-text'>${escapedAngleBrackets}</code></span>`;
}