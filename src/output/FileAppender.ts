import { EditorPosition, EditorRange, MarkdownView } from "obsidian";

export default class FileAppender {
    view: MarkdownView;
    codeBlockElement: HTMLPreElement
    codeBlockRange: EditorRange
    outputPosition: EditorPosition;
    
    public constructor (view: MarkdownView) {
        this.view = view;
    }
    
    public clearOutput() {
        if (this.codeBlockRange && this.outputPosition) {
            
            const editor = this.view.editor;
            
            const afterEndOfOutputCodeBlock = editor.offsetToPos(
                editor.posToOffset(this.outputPosition) + "\n```".length
            );
            
            editor.replaceRange("", this.codeBlockRange.to, afterEndOfOutputCodeBlock);
            this.view.setViewData(editor.getValue(), false);
            
            this.outputPosition = null;
        }
    }
    
    public addOutput(output: string) {
        this.addOutputBlock();
        
        const editor = this.view.editor;
        
        editor.replaceRange(output, this.outputPosition);
        this.outputPosition = editor.offsetToPos(
            editor.posToOffset(this.outputPosition) + output.length
        );
        
        this.view.setViewData(this.view.editor.getValue(), false);
        console.log(editor.getValue());
    }
    
    public setCodeBlock(blockElem: HTMLPreElement) {
        if(this.codeBlockElement != blockElem) {
            this.codeBlockElement = blockElem;
            const blockIndex = this.getIndexOfCodeBlock(blockElem);
            this.codeBlockRange = this.getCodeBlockTextRangeByIndex(blockIndex);
        }
    }
    
    addOutputBlock() {
        const editor = this.view.editor;
        
        const EXPECTED_SUFFIX = "\n```output\n"
        
        const outputBlockSigilRange: EditorRange = {
            from: this.codeBlockRange.to,
            to: editor.offsetToPos(
                editor.posToOffset(this.codeBlockRange.to) + EXPECTED_SUFFIX.length
            )
        }
        
        const hasOutput = editor.getRange(outputBlockSigilRange.from, outputBlockSigilRange.to) == EXPECTED_SUFFIX;
        
        if(hasOutput) {
            this.outputPosition = outputBlockSigilRange.to;
        } else {
            editor.replaceRange(EXPECTED_SUFFIX + "\n```", this.codeBlockRange.to);
            this.view.data = this.view.editor.getValue();
            //We need to recalculate the offsetToPos because the insertion will've changed the lines.
            this.outputPosition = editor.offsetToPos(
                editor.posToOffset(this.codeBlockRange.to) + EXPECTED_SUFFIX.length
            )
        }
    }
    
    getCodeBlockTextRangeByIndex(searchBlockIndex: number): EditorRange | null {
        const textContent = this.view.data;
        
        const PADDING = "\n\n\n\n\n";
        
        let escaped, inBlock, blockI = 0, last5 = PADDING, blockStart, charIndex = 0;
        for(const char of textContent + PADDING) {
            last5 = last5.substring(1) + char;
            console.log(last5, char, inBlock, blockI, charIndex, searchBlockIndex);
            if(escaped) {
                escaped = false;
                continue;
            }
            if(char == "\\") {
                escaped = true;
                continue;
            }
            if(last5.substring(0,4) == "\n```") {
                inBlock = !inBlock;
                //If we are entering a block, set the block start
                if(inBlock) {
                    blockStart = charIndex - 4;
                } else {
                    //if we're leaving a block, check if its index is the searched index
                    if(blockI == searchBlockIndex) {
                        return { 
                            from: this.view.editor.offsetToPos(blockStart), 
                            to: this.view.editor.offsetToPos(charIndex)
                        }
                    } else {// if it isn't, just increase the block index
                        blockI++;
                    }
                }
            }
            charIndex++;
        }
        return null;
    }
    
    getIndexOfCodeBlock(codeBlock: HTMLPreElement): number {
        const container = this.findContainer(codeBlock);
        
        const preBlocks = Array.from(container.getElementsByTagName("pre"));
        
        let iHasLanguage = 0;
        for(const block of preBlocks) {
            if (block == codeBlock) return iHasLanguage;
            if(block.className.includes("language-")) iHasLanguage++;
        }
        return -1;
    }
    findContainer(codeBlock: HTMLElement) {
        console.log(codeBlock);
        let target = codeBlock;
        while (!target.classList.contains("markdown-reading-view")) target = target.parentElement;
        return target;
    }
}