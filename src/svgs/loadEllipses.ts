import parseHTML from "./parseHTML";

const svg = parseHTML(`<svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
        <circle cx="1.5" r="1" cy="5" style="fill:currentColor"/>
        <circle cx="5" r="1" cy="5" style="fill:currentColor"/>
        <circle cx="8.5" r="1" cy="5" style="fill:currentColor"/>
        </svg>`);

export default () => {
    return svg.cloneNode(true);
}