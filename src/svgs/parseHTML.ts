export default (html: string) => {
    let container = document.createElement("div");
    container.innerHTML = html;
    return container.firstElementChild;
}