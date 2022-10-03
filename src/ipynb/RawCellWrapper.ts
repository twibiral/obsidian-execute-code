import { Cell, RawCell } from "./InteractivePythonNotebook";
import MarkdownCellWrapper from "./MarkdownCellWrapper";

export default class RawCellWrapper extends MarkdownCellWrapper {
    
    constructor(cell: RawCell) {
        super({
            cell_type: "markdown",
            id: cell.id,
            metadata: cell.metadata,
            attachments: cell.attachments,
            source: escapeMarkdown(cell.source)
        })
    }
    
}