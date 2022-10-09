export default (code: string, globalsName: string, localsName: string, printName: string, finishSigil: string) =>
/*python*/`
${code.contains("matplotlib") ?
/*python*/`
try:
    import matplotlib
except:
    pass

try:
    matplotlib.use('agg')
except:
    pass
` : ""}

try:
    try:
        ${printName}(eval(
            compile(${JSON.stringify(code.replace(/\r\n/g, "\n") + "\n")}, "<code block>", "eval"),
            ${globalsName}, ${localsName}
        ))
    except SyntaxError:
        exec(
            compile(${JSON.stringify(code.replace(/\r\n/g, "\n") + "\n")}, "<code block>", "exec"),
            ${globalsName}, ${localsName}
        )
except Exception as e:
    ${printName} (e, file=sys.stderr)
finally:
    ${printName} ("${finishSigil}", end="")

`;
