import parseHTML from "./parseHTML";

const svg = parseHTML(`<svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
        <style>@keyframes spinner_svv2{100%{transform:rotate(360deg)}}</style>
        <path d="M1 5 A 4 4 0 1 1 9 5" style="transform-origin: center; fill: none; stroke: currentColor; stroke-width: 0.5; animation:spinner_svv2 .75s infinite linear"/>
        </svg>`);

export default () => {
    return svg.cloneNode(true);
}