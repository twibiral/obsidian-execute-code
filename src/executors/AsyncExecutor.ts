import Executor from "./Executor";

type PromiseableCallback = (resolve: (result?: any) => void, reject: (reason?: any) => void) => void

export default abstract class AsyncExecutor extends Executor {
    private runningTask: Promise<void> = Promise.resolve();
    
    
    
    protected async addJobToQueue(
        promiseCallback: PromiseableCallback
    ): Promise<void> {
        const previousJob = this.runningTask;
        
        this.runningTask = new Promise((resolve, reject) => {
            previousJob.finally(async () => {
                try {
                    await new Promise(promiseCallback);
                    resolve();
                } catch(e) {
                    reject(e);
                }
                
            })
        })
        
        return this.runningTask;
    }
}