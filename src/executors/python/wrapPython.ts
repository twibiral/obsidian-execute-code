export const PLT_DEFAULT_BACKEND_PY_VAR = "OBSIDIAN_EXECUTE_CODE_MATPLOTLIB_DEFAULT_BACKEND";

export default (code: string, globalsName: string, localsName: string, printName: string, finishSigil: string, embedPlots: boolean) =>
/*python*/`
${embedPlots ?
// Use 'agg' raster non-interactive renderer to prevent freezing the runtime on plt.show()
/*python*/`
try:
    matplotlib.use('agg')
except:
    pass
` :
// Use the default renderer stored in the python variable from 'async setup()' in 'PythonExecutor' when not embedding
/*python*/`
try:
    matplotlib.use(${PLT_DEFAULT_BACKEND_PY_VAR})
except:
    pass
`}

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
