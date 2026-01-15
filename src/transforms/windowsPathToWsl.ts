import { join } from "path/posix";

export default (windowsPath: string) => {
    const driveLetter = windowsPath[0].toLowerCase();
    const posixyPath = windowsPath.replace(/^[^:]*:/, "") //remove drive letter
        .replace(/\\/g, "/"); //force / as separator
        
    return join("/mnt/", driveLetter, posixyPath);
}