import parseHTML from "./parseHTML";

const svg = parseHTML(`<svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 5 V 5 M 5 5 V 5 M 9 5 V 5" style="fill: none; stroke: currentColor; stroke-width: 0.5"/>
        </svg>`);

export default () => {
    return svg.cloneNode(true);
}