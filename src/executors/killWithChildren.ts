import { exec } from "child_process"

export default (pid: number): Promise<void> => {
    
    return new Promise((resolve, reject) => {
        if(process.platform === "win32") {
            exec(`taskkill /pid ${pid} /T /F`, () => resolve());
        } else {
            exec(`pkill -P ${pid}`, () => {
                process.kill(pid);
                resolve();
            });
        }
    });
}