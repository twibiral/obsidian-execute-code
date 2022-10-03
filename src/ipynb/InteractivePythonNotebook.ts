
/*
Generated from https://github.com/jupyter/nbformat/blob/c419830da3dd3ea9045a13cdce81e397d173c8b2/nbformat/v4/nbformat.v4.schema.json, which
is licensed under the terms of the Modified BSD License (also known as New or Revised or 3-Clause BSD), as follows:

    Copyright (c) 2001-2015, IPython Development Team
    Copyright (c) 2015-, Jupyter Development Team

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

Neither the name of the Jupyter Development Team nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


export type Cell = RawCell | MarkdownCell | CodeCell
/**
 * A string field representing the identifier of this particular cell.
 */
export type CellId = string
export type Output = ExecuteResult | DisplayData | Stream | Error

/**
 * Jupyter Notebook v4.5 JSON schema.
 */
export interface InteractivePythonNotebook {
    /**
     * Notebook root-level metadata.
     */
    metadata: {
        /**
         * Kernel information.
         */
        kernelspec?: {
            /**
             * Name of the kernel specification.
             */
            name: string
            /**
             * Name to display in UI.
             */
            display_name: string
            [k: string]: unknown
        }
        /**
         * Kernel information.
         */
        language_info?: {
            /**
             * The programming language which this kernel runs.
             */
            name: string
            /**
             * The codemirror mode to use for code in this language.
             */
            codemirror_mode?:
            | string
            | {
                [k: string]: unknown
            }
            /**
             * The file extension for files in this language.
             */
            file_extension?: string
            /**
             * The mimetype corresponding to files in this language.
             */
            mimetype?: string
            /**
             * The pygments lexer to use for code in this language.
             */
            pygments_lexer?: string
            [k: string]: unknown
        }
        /**
         * Original notebook format (major number) before converting the notebook between versions. This should never be written to a file.
         */
        orig_nbformat?: number
        /**
         * The title of the notebook document
         */
        title?: string
        /**
         * The author(s) of the notebook document
         */
        authors?: unknown[]
        [k: string]: unknown
    }
    /**
     * Notebook format (minor number). Incremented for backward compatible changes to the notebook format.
     */
    nbformat_minor: number
    /**
     * Notebook format (major number). Incremented between backwards incompatible changes to the notebook format.
     */
    nbformat: number
    /**
     * Array of cells of the current notebook.
     */
    cells: Cell[]
}
/**
 * Notebook raw nbconvert cell.
 */
export interface RawCell {
    id: CellId
    /**
     * String identifying the type of cell.
     */
    cell_type: "raw"
    /**
     * Cell-level metadata.
     */
    metadata: {
        /**
         * Raw cell metadata format for nbconvert.
         */
        format?: string
        /**
         * Official Jupyter Metadata for Raw Cells
         */
        jupyter?: {
            [k: string]: unknown
        }
        /**
         * The cell's name. If present, must be a non-empty string. Cell names are expected to be unique across all the cells in a given notebook. This criterion cannot be checked by the json schema and must be established by an additional check.
         */
        name?: string
        /**
         * The cell's tags. Tags must be unique, and must not contain commas.
         */
        tags?: string[]
        [k: string]: unknown
    }
    /**
     * Media attachments (e.g. inline images), stored as mimebundle keyed by filename.
     */
    attachments?: {
        /**
         * The attachment's data stored as a mimebundle.
         *
         * This interface was referenced by `undefined`'s JSON-Schema definition
         * via the `patternProperty` ".*".
         */
        [k: string]: {
            /**
             * mimetype output (e.g. text/plain), represented as either an array of strings or a string.
             */
            [k: string]: string | string[]
        }
    }
    /**
     * Contents of the cell, represented as an array of lines.
     */
    source: string | string[]
}
/**
 * Notebook markdown cell.
 */
export interface MarkdownCell {
    id: CellId
    /**
     * String identifying the type of cell.
     */
    cell_type: "markdown"
    /**
     * Cell-level metadata.
     */
    metadata: {
        /**
         * The cell's name. If present, must be a non-empty string. Cell names are expected to be unique across all the cells in a given notebook. This criterion cannot be checked by the json schema and must be established by an additional check.
         */
        name?: string
        /**
         * The cell's tags. Tags must be unique, and must not contain commas.
         */
        tags?: string[]
        /**
         * Official Jupyter Metadata for Markdown Cells
         */
        jupyter?: {
            [k: string]: unknown
        }
        [k: string]: unknown
    }
    /**
     * Media attachments (e.g. inline images), stored as mimebundle keyed by filename.
     */
    attachments?: {
        /**
         * The attachment's data stored as a mimebundle.
         *
         * This interface was referenced by `undefined`'s JSON-Schema definition
         * via the `patternProperty` ".*".
         */
        [k: string]: {
            /**
             * mimetype output (e.g. text/plain), represented as either an array of strings or a string.
             */
            [k: string]: string | string[]
        }
    }
    /**
     * Contents of the cell, represented as an array of lines.
     */
    source: string | string[]
}
/**
 * Notebook code cell.
 */
export interface CodeCell {
    id: CellId
    /**
     * String identifying the type of cell.
     */
    cell_type: "code"
    /**
     * Cell-level metadata.
     */
    metadata: {
        /**
         * Official Jupyter Metadata for Code Cells
         */
        jupyter?: {
            [k: string]: unknown
        }
        /**
         * Execution time for the code in the cell. This tracks time at which messages are received from iopub or shell channels
         */
        execution?: {
            /**
             * header.date (in ISO 8601 format) of iopub channel's execute_input message. It indicates the time at which the kernel broadcasts an execute_input message to connected frontends
             */
            "iopub.execute_input"?: string
            /**
             * header.date (in ISO 8601 format) of iopub channel's kernel status message when the status is 'busy'
             */
            "iopub.status.busy"?: string
            /**
             * header.date (in ISO 8601 format) of the shell channel's execute_reply message. It indicates the time at which the execute_reply message was created
             */
            "shell.execute_reply"?: string
            /**
             * header.date (in ISO 8601 format) of iopub channel's kernel status message when the status is 'idle'. It indicates the time at which kernel finished processing the associated request
             */
            "iopub.status.idle"?: string
            [k: string]: unknown
        }
        /**
         * Whether the cell's output is collapsed/expanded.
         */
        collapsed?: boolean
        /**
         * Whether the cell's output is scrolled, unscrolled, or autoscrolled.
         */
        scrolled?: true | false | "auto"
        /**
         * The cell's name. If present, must be a non-empty string. Cell names are expected to be unique across all the cells in a given notebook. This criterion cannot be checked by the json schema and must be established by an additional check.
         */
        name?: string
        /**
         * The cell's tags. Tags must be unique, and must not contain commas.
         */
        tags?: string[]
        [k: string]: unknown
    }
    /**
     * Contents of the cell, represented as an array of lines.
     */
    source: string | string[]
    /**
     * Execution, display, or stream outputs.
     */
    outputs: Output[]
    /**
     * The code cell's prompt number. Will be null if the cell has not been run.
     */
    execution_count: number | null
}
/**
 * Result of executing a code cell.
 */
export interface ExecuteResult {
    /**
     * Type of cell output.
     */
    output_type: "execute_result"
    /**
     * A result's prompt number.
     */
    execution_count: number | null
    /**
     * A mime-type keyed dictionary of data
     */
    data: {
        /**
         * mimetype output (e.g. text/plain), represented as either an array of strings or a string.
         */
        [k: string]: string | string[]
    }
    /**
     * Cell output metadata.
     */
    metadata: {
        [k: string]: unknown
    }
}
/**
 * Data displayed as a result of code cell execution.
 */
export interface DisplayData {
    /**
     * Type of cell output.
     */
    output_type: "display_data"
    /**
     * A mime-type keyed dictionary of data
     */
    data: {
        /**
         * mimetype output (e.g. text/plain), represented as either an array of strings or a string.
         */
        [k: string]: string | string[]
    }
    /**
     * Cell output metadata.
     */
    metadata: {
        [k: string]: unknown
    }
}
/**
 * Stream output from a code cell.
 */
export interface Stream {
    /**
     * Type of cell output.
     */
    output_type: "stream"
    /**
     * The name of the stream (stdout, stderr).
     */
    name: string
    /**
     * The stream's text output, represented as an array of strings.
     */
    text: string | string[]
}
/**
 * Output of an error that occurred during code cell execution.
 */
export interface Error {
    /**
     * Type of cell output.
     */
    output_type: "error"
    /**
     * The name of the error.
     */
    ename: string
    /**
     * The value, or message, of the error.
     */
    evalue: string
    /**
     * The error's traceback, represented as an array of strings.
     */
    traceback: string[]
}
