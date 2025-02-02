import NonInteractiveCodeExecutor from "./NonInteractiveCodeExecutor";
import { Outputter } from "../output/Outputter";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import { ChildProcess, spawn } from "child_process";
import * as os from "os";
import { isStandaloneClass } from "src/transforms/LatexTransformer";
import { updateImage, writeFileLink } from "src/output/LatexInserter";

const REQUEST_RERUN_WARNING: RegExp = /LaTeX Warning: .* Rerun to get cross-references right./
const MAX_COMPILER_RERUNS = 10;

interface ExecutionContext {
    workingDir?: string;
    outputDir: string;
    outputter: Outputter;
}

export default class LaTeXExecutor extends NonInteractiveCodeExecutor {
    compilerRequestsRerun = new Set<ChildProcess>;
    removeBuildDir: () => void;

    /** Main entry point for LaTeX compilation that handles PDF generation and conversion to other formats. */
    async run(latexSrc: string, outputter: Outputter, compilerPath: string, compilerArgs: string, exportPath: string): Promise<void> {
        outputter.clear();
        outputter.killBlock = (subprocesses) => this.killSubprocesses(subprocesses);
        const s = this.settings;
        const exec: ExecutionContext = {
            outputter: outputter,
            outputDir: path.dirname(exportPath),
        };
        const figureName = path.basename(exportPath, path.extname(exportPath));
        const errorHandler = (error: any) => {
            outputter.writeErr(error + '\n');
            outputter.closeInput();
        };

        // Synchronous compilation
        let pdfFile: string;
        try {
            exec.workingDir = await this.createTempDirectory(outputter);
            pdfFile = await this.compileAndCrop(latexSrc, compilerArgs, compilerPath, exec);
        } catch (error) {
            errorHandler(error);
            this.cleanupBuildDir(exec);
            return;
        }

        // Asynchronous convertion
        if (s.latexSavePdf) {
            this.savePdf(pdfFile, exportPath, `${figureName}.pdf`, exec).catch(errorHandler);
        }
        if (s.latexSaveSvg === "poppler") {
            this.runChildProcess(s.latexSvgPath, [s.latexSvgArgs, pdfFile], `${figureName}.svg`, exec)
                .catch(errorHandler);
        }
        if (s.latexSaveSvg === "inkscape") {
            this.runChildProcess(s.latexInkscapePath, [s.latexInkscapeArgs, pdfFile, '--export-filename'], `${figureName}.svg`, exec)
                .catch(errorHandler);
        }
        if (s.latexSavePng) {
            this.runChildProcess(s.latexPngPath, [s.latexPngArgs, pdfFile], `${figureName}.png`, exec, { outFileArg: figureName })
                .catch(errorHandler);
        }

        this.cleanupBuildDir(exec);
    }

    /** Compiles LaTeX source and crops PDF to content if enabled. */
    private async compileAndCrop(latexSrc: string, compilerArgs: string, compilerPath: string, exec: ExecutionContext) {
        const s = this.settings;
        const buildDir = exec.workingDir;
        const texFile = await this.writeContentToTexFile(latexSrc, buildDir, 'o.tex');
        compilerArgs = [compilerArgs, `-output-directory=${buildDir}`, texFile].join(' ');
        const allowIncludesRelativeToAttachmentDir: ExecutionContext = { outputDir: buildDir, workingDir: exec.outputDir, outputter: exec.outputter, }
        const cropInBuildDir: ExecutionContext = { outputDir: buildDir, workingDir: buildDir, outputter: exec.outputter, }

        let pdfFile = await this.compileAndRerun(compilerPath, compilerArgs, allowIncludesRelativeToAttachmentDir);
        if (s.latexKeepLog) {
            const logFile = path.join(buildDir, 'o.log');
            await exec.outputter.writeMarkdown(`Log: [${logFile}](file://${logFile})`, true);
        }
        const isExcludedDocumentclass = s.latexCropNoStandalone && isStandaloneClass(latexSrc);
        if (s.latexDoCrop && !isExcludedDocumentclass) {
            await fs.rename(path.join(buildDir, pdfFile), path.join(buildDir, 'original.pdf'));
            pdfFile = await this.runChildProcess(s.latexCropPath, [s.latexCropArgs, 'original.pdf'], pdfFile, cropInBuildDir, { skipWriteFileLink: true });
        }
        return pdfFile;
    }

    /** Handles LaTeX compilation with automatic reruns for cross-references. */
    private async compileAndRerun(compilerPath: string, args: string, exec: ExecutionContext): Promise<string> {
        for (let attempt = 0; attempt <= MAX_COMPILER_RERUNS; attempt++) {
            const isLastAttempt = attempt == MAX_COMPILER_RERUNS;
            const result = await this.runChildProcess(compilerPath, args.split(' '), 'o.pdf', exec, { skipWriteFileLink: true, outFileArg: "", doDetectRerun: !isLastAttempt });
            const hasRequestedRerun = result === undefined;
            if (!hasRequestedRerun) return result;
        }
        throw `LaTeX compilation did not result in a PDF file.`;
    }

    /** Stop running child processes on clicking Clear or Run again. */
    private killSubprocesses(subprocesses: Set<ChildProcess>) {
        for (const child of subprocesses) {
            child.kill('SIGINT');
            console.log(`Subprocess ${path.basename(child.spawnfile)} killed.`);
            subprocesses.delete(child);
        }
    }

    /** Save PDF as vault attachment */
    private async savePdf(pdfFile: string, exportPath: string, figureName: string, exec: ExecutionContext): Promise<void> {
        const pdfPath = path.join(exec.workingDir, pdfFile);
        const destinationPath = `${exportPath}.pdf`;

        try {
            await fs.copyFile(pdfPath, destinationPath);
        } catch (error) {
            throw `Failed to copy ${pdfPath} to ${destinationPath}: ${error}`;
        }

        await writeFileLink(figureName, destinationPath, exec.outputter);
    }

    /** Executes a child process and capture its output. */
    private async runChildProcess(cmd: string, args: string[], outName: string, exec: ExecutionContext, options?: { outFileArg?: string, skipWriteFileLink?: boolean, doDetectRerun?: boolean }): Promise<string | undefined> {
        const outDir = exec.outputDir;
        const cwdDir = exec.workingDir;
        const outputter = exec.outputter;
        let outFileArg: string = options?.outFileArg || outName;
        const outFile = path.join(outDir, outFileArg);
        if (outFileArg) {
            if (outDir !== cwdDir) {
                outFileArg = outFile;
            }
            args.push(`"${outFileArg}"`);
        }

        const child = spawn(cmd, args, {
            env: process.env,
            windowsVerbatimArguments: true,
            cwd: cwdDir,
            shell: Boolean(this.settings.latexSubprocessesUseShell)
        });
        outputter.runningSubprocesses.add(child);
        const description = `Subprocess ${cmd} ${args.join(" ")}`;


        child.stdout.on('data', (data) => outputter.write(data.toString()));
        child.stderr.on('data', (data) => outputter.writeErr(data.toString()));
        outputter.on('data', (data) => child.stdin.write(data));
        if (options?.doDetectRerun) {
            child.stdout.on('data', (data) => this.detectWarningRequestingRerun(data, child));
        }

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (!outputter.runningSubprocesses.has(child)) return;
                child.kill('SIGTERM');
                reject(new Error(`${description} timed out after ${this.settings.timeout} ms.`));
            }, this.settings.timeout);

            child.on('error', (err) => reject(`${description} throws:\n${err}`));
            child.on('close', async (code) => {
                const resultedInFile = fsSync.existsSync(path.join(outDir, outName));
                outputter.runningSubprocesses.delete(child);

                if (code != 0) return reject(`${description} failed with code ${code}.`);
                if (!resultedInFile) return reject(`${description} failed to create ${outFile}.`);

                if (options?.doDetectRerun && this.compilerRequestsRerun.has(child)) {
                    this.compilerRequestsRerun.delete(child);
                    return resolve(undefined);
                }

                if (options?.skipWriteFileLink) return resolve(outName);
                const figureEmbeddings: NodeListOf<HTMLImageElement> = document.querySelectorAll(`img[alt="${outName}"]`);
                figureEmbeddings.forEach(img => updateImage(img));

                await writeFileLink(outName, path.join(outDir, outName), outputter);
                await sleep(200); // Wait for obsidian to index attachment
                if (this.settings.latexOutputEmbeddings) {
                    await outputter.writeMarkdown(`![[${outName}]]`, true);
                }
                outputter.closeInput();
                return resolve(outName);
            });
        });
    }

    /** Checks LaTeX output for warnings indicating need for additional compilation pass */
    private detectWarningRequestingRerun(data: any, child: ChildProcess) {
        if (REQUEST_RERUN_WARNING.test(data.toString())) {
            this.compilerRequestsRerun.add(child);
        };
    }

    private async writeContentToTexFile(codeBlockContent: string, buildDir: string, filename: string): Promise<string> {
        const texFile = path.join(buildDir, filename)
        await fs.writeFile(texFile, codeBlockContent);
        return filename;
    }

    /** Creates a unique temporary directory for the current LaTeX compilation */
    private async createTempDirectory(outputter: Outputter): Promise<string> {
        const millisToday = Date.now() - new Date().setHours(0, 0, 0, 0);
        const prefix = "tex" + millisToday.toString();
        const prefixPath = path.join(os.tmpdir(), prefix)
        const buildDir = await fs.mkdtemp(prefixPath);
        this.removeBuildDir = async () => {
            const success = await this.removeLockedFolder(buildDir);
            if (success) outputter.closeInput();
        };
        return buildDir;
    }

    /** Attempts to clean up the build directory with retry logic for locked files */
    private async cleanupBuildDir(exec: ExecutionContext) {
        const path: string | null = exec.workingDir;
        if (!path || this.settings.latexKeepLog) return;

        await sleep(100); // Wait for subprocesses to start
        if (!fsSync.existsSync(path)) return;

        const maxRetries = 10;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            await sleep(500); // Wait for subprocesses to unlock folder
            if (!fsSync.existsSync(path)) return;
            if (exec.outputter.runningSubprocesses.size > 0) continue;
            const success = await this.removeLockedFolder(path, `Build folder busy, retrying (${attempt + 1}/${maxRetries}).`);
            if (success) {
                exec.outputter.closeInput();
                return;
            }
        }
        throw new Error('Failed to delete folder after multiple attempts.');
    }

    /** Safely removes a directory that might be locked by the system */
    private async removeLockedFolder(path: string, comment?: string): Promise<boolean> {
        try {
            await fs.rmdir(path, { recursive: true });
            console.debug(`Removed build folder: ${path}`);
            return true;
        } catch (error) {
            if (error.code != 'EBUSY' && error.code != 'ENOENT') throw error;
            if (comment) {
                console.log(comment);
            }
        }
        return false;
    }
}