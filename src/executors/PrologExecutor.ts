// @ts-ignore
import * as prolog from "tau-prolog";
import {Outputter} from "src/Outputter";
import Executor from "./Executor";
import {Notice} from "obsidian";
import {ExecutorSettings} from "src/settings/Settings";

export default class PrologExecutor extends Executor {
    
    runQueries: boolean;
    maxPrologAnswers: number;
    
    constructor(settings: ExecutorSettings, file: string) {
        super(file, "prolog");
        this.runQueries = true;
        this.maxPrologAnswers = settings.maxPrologAnswers;
    }
    
    async run(code: string, outputter: Outputter, cmd: string, cmdArgs: string, ext: string): Promise<void> {
        let prologCode = code.split(/\n+%+\s*query\n+/);
        
        if (prologCode.length < 2) return;	// no query found
        
        //Prolog does not support input
        outputter.closeInput();
            
        return this.runPrologCode(prologCode[0], prologCode[1], outputter);
    }
    async stop() {
        this.runQueries = false;
        this.emit("close");
    }
    
    /**
 * Executes a string with prolog code using the TauProlog interpreter.
 * All queries must be below a line containing only '% queries'.
 *
 * @param facts Contains the facts.
 * @param queries Contains the queries.
 * @param out The {@link Outputter} that should be used to display the output of the code.
 */
    private runPrologCode(facts: string, queries: string, out: Outputter) {
        new Notice("Running...");
        const session = prolog.create();
        session.consult(facts
            , {
                success: () => {
                    session.query(queries
                        , {
                            success: async (goal: any) => {
                                console.debug(`Prolog goal: ${goal}`)
                                let answersLeft = true;
                                let counter = 0;

                                while (answersLeft && counter < this.maxPrologAnswers) {
                                    await session.answer({
                                        success: function (answer: any) {
                                            new Notice("Done!");
                                            console.debug(`Prolog result: ${session.format_answer(answer)}`);
                                            out.write(session.format_answer(answer) + "\n");
                                            out.closeInput();
                                        },
                                        fail: function () {
                                            /* No more answers */
                                            answersLeft = false;
                                        },
                                        error: function (err: any) {
                                            new Notice("Error!");
                                            console.error(err);
                                            answersLeft = false;
                                            out.writeErr(`Error while executing code: ${err}`);
                                            out.closeInput();
                                        },
                                        limit: function () {
                                            answersLeft = false;
                                        }
                                    });
                                    counter++;
                                }
                            },
                            error: (err: any) => {
                                new Notice("Error!");
                                out.writeErr("Query failed.\n")
                                out.writeErr(err.toString());
                            }
                        }
                    )
                },
                error: (err: any) => {
                    out.writeErr("Adding facts failed.\n")
                    out.writeErr(err.toString());
                }
            }
        );
    }
    
}
