import { EditorPosition, EditorRange, MarkdownView } from "obsidian";

export default class FileAppender {
    view: MarkdownView;
    codeBlockElement: HTMLPreElement
    codeBlockRange: EditorRange
    outputPosition: EditorPosition;

    public constructor(view: MarkdownView, blockElem: HTMLPreElement) {
        this.view = view;
        
        this.codeBlockElement = blockElem;
        this.codeBlockRange = this.getRangeOfCodeBlock(blockElem);
    }

    public clearOutput() {
        if (this.codeBlockRange && this.outputPosition) {

            const editor = this.view.editor;

            //Offset this.outputPosition by "\n```"
            const afterEndOfOutputCodeBlock: EditorPosition = {
                line: this.outputPosition.line + 1,
                ch: "```".length    
            };

            editor.replaceRange("", this.codeBlockRange.to, afterEndOfOutputCodeBlock);
            this.view.setViewData(editor.getValue(), false);

            this.outputPosition = null;
        }
    }

    public addOutput(output: string) {
        this.findOutputTarget();

        const editor = this.view.editor;

        editor.replaceRange(output, this.outputPosition);
        
        const lines = output.split("\n");
        this.outputPosition = {
            line: this.outputPosition.line + (lines.length - 1), //if the addition is only 1 line, don't change current line pos
            ch: (lines.length == 1 ? //if the addition is only 1 line, then offset from the existing position.
                this.outputPosition.ch : 0  //If it's not, ignore it.
            ) + lines[lines.length - 1].length
        }

        this.view.setViewData(this.view.editor.getValue(), false);
    }
    
    /**
     * Get the output's string from the document. 
     */
    public getRenderedOutput(): string {
        this.findOutputTarget(false);
        
        const CODE_BLOCK_START = "\n```output\n";
        
        return this.view.editor
            .getRange(this.codeBlockRange.to, this.outputPosition)
            .substring(CODE_BLOCK_START.length)
            .trim();
    }

    /**
     * Finds where output should be appended to and sets the `outputPosition` property to reflect it.
     * @param addIfNotExist Add an `output` code block if one doesn't exist already
     */
    findOutputTarget(addIfNotExist = true) {
        const editor = this.view.editor;
        
        const EXPECTED_SUFFIX = "\n```output\n";
        
        const sigilEndIndex = editor.posToOffset(this.codeBlockRange.to) + EXPECTED_SUFFIX.length;

        const outputBlockSigilRange: EditorRange = {
            from: this.codeBlockRange.to,
            to: {
                ch: 0, //since the suffix ends with a newline, it'll be column 0
                line: this.codeBlockRange.to.line + 2 // the suffix adds 2 lines
            }
        }

        const hasOutput = editor.getRange(outputBlockSigilRange.from, outputBlockSigilRange.to) == EXPECTED_SUFFIX;

        if (hasOutput) {
            //find the first code block end that occurs after the ```output sigil
            const index = editor.getValue().indexOf("\n```\n", sigilEndIndex);
            
            //bail out if we didn't find an end
            if(index == -1) {
                this.outputPosition = outputBlockSigilRange.to;
            } else {
                //subtract 1 so output appears before the newline
                this.outputPosition = editor.offsetToPos(index - 1);
            }
        } else if (addIfNotExist) {
            editor.replaceRange(EXPECTED_SUFFIX + "\n```\n", this.codeBlockRange.to);
            this.view.data = this.view.editor.getValue();
            //We need to recalculate the outputPosition because the insertion will've changed the lines.
            //The expected suffix ends with a newline, so the column will always be 0; 
            //the row will be the current row + 2: the suffix adds 2 lines
            this.outputPosition = {
                ch: 0,
                line: this.codeBlockRange.to.line + 2
            };
            
        } else {
            this.outputPosition = outputBlockSigilRange.to;
        }
    }

    /**
     * With a starting line, ending line, and number of codeblocks in-between those, find the exact EditorRange of a code block.
     * 
     * @param startLine The line to start searching at
     * @param endLine The line to end searching AFTER (i.e. it is inclusive)
     * @param searchBlockIndex The index of code block, within the startLine-endLine range, to search for
     * @returns an EditorRange representing the range occupied by the given block, or null if it couldn't be found
     */
    findExactCodeBlockRange(startLine: number, endLine: number, searchBlockIndex: number): EditorRange | null {
        const editor = this.view.editor;
        const textContent = editor.getValue();

        const startIndex = editor.posToOffset({ ch: 0, line: startLine });
        const endIndex = editor.posToOffset({ ch: 0, line: endLine + 1 });

        //Start the parsing with a given amount of padding.
        //This helps us if the section begins directly with "```".
        //At the end, it iterates through the padding again.
        const PADDING = "\n\n\n\n\n";


        /*
         escaped: whether we are currently in an escape character
         inBlock: whether we are currently inside a code block
         last5: a rolling buffer of the last 5 characters. 
            It could technically work with 4, but it's easier to do 5
            and it leaves open future advanced parsing.
         blockStart: the start of the last code block we entered
         
         */
        let escaped, inBlock, blockI = 0, last5 = PADDING, blockStart
        for (let i = startIndex; i < endIndex + PADDING.length; i++) {
            const char = i < endIndex ? textContent[i] : PADDING[0];

            last5 = last5.substring(1) + char;
            if (escaped) {
                escaped = false;
                continue;
            }
            if (char == "\\") {
                escaped = true;
                continue;
            }
            if (last5.substring(0, 4) == "\n```") {
                inBlock = !inBlock;
                //If we are entering a block, set the block start
                if (inBlock) {
                    blockStart = i - 4;
                } else {
                    //if we're leaving a block, check if its index is the searched index
                    if (blockI == searchBlockIndex) {
                        return {
                            from: this.view.editor.offsetToPos(blockStart),
                            to: this.view.editor.offsetToPos(i)
                        }
                    } else {// if it isn't, just increase the block index
                        blockI++;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Uses an undocumented API to find the EditorRange that corresponds to a given codeblock's element.
     * Returns null if it wasn't able to find the range.
     * @param codeBlock <pre> element of the desired code block
     * @returns the corresponding EditorRange, or null
     */
    getRangeOfCodeBlock(codeBlock: HTMLPreElement): EditorRange | null {
        const parent = codeBlock.parentElement;
        const index = Array.from(parent.children).indexOf(codeBlock);

        //@ts-ignore
        const section: null | { lineStart: number, lineEnd: number } = this.view.previewMode.renderer.sections.find(x => x.el == parent);

        if (section) {
            return this.findExactCodeBlockRange(section.lineStart, section.lineEnd, index);
        } else {
            return null;
        }
    }
}