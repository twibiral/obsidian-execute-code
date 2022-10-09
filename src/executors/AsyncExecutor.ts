import Executor from "./Executor";

type PromiseableCallback = (resolve: (result?: any) => void, reject: (reason?: any) => void) => void

export default abstract class AsyncExecutor extends Executor {
	private runningTask: Promise<void> = Promise.resolve();


	/**
	 * Add a job to the internal executor queue.
	 * Callbacks are guaranteed  to only be called once, and to be called when there are no other tasks running.
	 * A callback is interpreted the same as a promise: it must call the `resolve` or `reject` callbacks to complete the job.
	 * The returned promise resolves when the job has completed.
	 */
	protected async addJobToQueue(promiseCallback: PromiseableCallback): Promise<void> {
		const previousJob = this.runningTask;

		this.runningTask = new Promise((resolve, reject) => {
			previousJob.finally(async () => {
				try {
					await new Promise((innerResolve, innerReject) => {
						this.once("close", () => innerResolve(undefined));
						promiseCallback(innerResolve, innerReject);
					});
					resolve();
				} catch (e) {
					reject(e);
				}

			})
		})

		return this.runningTask;
	}
}
