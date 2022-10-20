import { join, sep } from "path";

export default (windowsPath: string) => {
    const driveLetter = windowsPath[0].toLowerCase();
    const posixyPath = windowsPath.replace(/^[^:]*:/, "") //remove drive letter
        .split(sep).join("/"); //force / as separator
        
    return join("/mnt/", driveLetter, posixyPath);
}