import { TextFileView } from "obsidian";
import { InteractivePythonNotebook } from "./InteractivePythonNotebook";

export const VIEW_TYPE_IPYNB = "execute-code-ipynb-view";

export default class IpynbView extends TextFileView {
    ipynbJson: InteractivePythonNotebook;
    
    getViewData() {
        return JSON.stringify(this.ipynbJson);
    }

    setViewData(data: string, clear: boolean) {
        this.data = data;
                
        this.ipynbJson = JSON.parse(this.data) as InteractivePythonNotebook;
        this.ipynbJson.metadata.language_info.name;
    }

    clear() {
        this.data = "";
        this.ipynbJson = null;
    }

    getViewType() {
        return VIEW_TYPE_IPYNB;
    }
}