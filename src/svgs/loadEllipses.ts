import parseHTML from "./parseHTML";

const svg = parseHTML(`<svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
    <style>
        @keyframes load_ellipse_anim{
	    0%{transform: translateY(0);}
	    25%{transform: translateY(-1.5px);}
	    100%{transform: translateY(0);}
        }
    </style>
    <circle cx="1.5" r="1" cy="5" style="fill:currentColor; animation: load_ellipse_anim 1.3s infinite ease-in-out 0.3s;"/>
    <circle cx="5" r="1" cy="5" style="fill:currentColor; animation: load_ellipse_anim 1.3s infinite ease-in-out 0.6s;"/>
    <circle cx="8.5" r="1" cy="5" style="fill:currentColor; animation: load_ellipse_anim 1.3s infinite ease-in-out 0.9s;"/>
</svg>`);

export default () => {
    return svg.cloneNode(true);
}