import { execSync } from "child_process"

export default (pid: number) => {
    if(process.platform === "win32") {
        execSync(`taskkill /pid ${pid} /T /F`)
    } else {
        execSync(`pkill -P ${pid}`)
        process.kill(pid);
    }
}