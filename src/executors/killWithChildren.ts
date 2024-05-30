import { execSync } from "child_process"

export default (pid: number) => {
    if(process.platform === "win32") {
        execSync(`taskkill /pid ${pid} /T /F`)
    } else {
		try {
	        execSync(`pkill -P ${pid}`)
		} catch(err) {
			// An error code of 1 signifies that no children were found to kill
			// In this case, ignore the error
			// Otherwise, re-throw it.
			if (err.status !== 1) throw err;
		}
        process.kill(pid);
    }
}
