import { App } from 'obsidian';
import { ExecutorSettings } from 'src/settings/Settings';
import { addFontSpec } from './LatexFontHandler';

export let appInstance: App;
export let settingsInstance: ExecutorSettings;

const DOCUMENT_CLASS: RegExp = /^[^%]*(?<src>\\documentclass\s*(\[(?<options>[^\]]*?)\])?\s*{\s*(?<class>[^}]*?)\s*})/;
interface DocumentClass {
    src: string,
    class: string,
    options: string,
}

export function modifyLatexCode(latexSrc: string, settings: ExecutorSettings): string {
    const documentClass: DocumentClass = captureDocumentClass(latexSrc)
    const injectSrc = ''
        + provideDocumentClass(documentClass?.class, settings.latexDocumentclass)
        + addFontSpec(settings)
        + disablePageNumberForCropping(settings);
    latexSrc = injectSrc + latexSrc;
    console.debug(`Injected LaTeX code:`, documentClass, injectSrc);

    latexSrc = moveDocumentClassToBeginning(latexSrc, documentClass);
    return latexSrc;
}

function disablePageNumberForCropping(settings: ExecutorSettings): string {
    return (settings.latexDoCrop && settings.latexCropNoPagenum)
        ? `\\pagestyle{empty}\n` : '';
}

function provideDocumentClass(currentClass: string, defaultClass: string): string {
    return (currentClass || defaultClass === "") ? ''
        : `\\documentclass{${defaultClass}}\n`;
}

function moveDocumentClassToBeginning(latexSrc: string, documentClass: DocumentClass): string {
    return (!documentClass?.src) ? latexSrc
        : documentClass.src + '\n' + latexSrc.replace(documentClass.src, '');
}

function captureDocumentClass(latexSrc: string): DocumentClass | undefined {
    const match: RegExpMatchArray = latexSrc.match(DOCUMENT_CLASS);
    if (!match) return undefined;
    return <DocumentClass>{ src: match.groups?.src, class: match.groups?.class, options: match.groups?.options };
}

export function isStandaloneClass(latexSrc: string): boolean {
    const className = captureDocumentClass(latexSrc)?.class;
    return className === "standalone";
}

export function updateBodyClass(className: string, isActive: boolean) {
    if (isActive) {
        document.body.classList.add(className);
    } else {
        document.body.classList.remove(className);
    }
}

export function applyLatexBodyClasses(app: App, settings: ExecutorSettings) {
    updateBodyClass('center-latex-figures', settings.latexCenterFigures);
    updateBodyClass('invert-latex-figures', settings.latexInvertFigures);
    appInstance = app;
    settingsInstance = settings;
}
