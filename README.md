# Obsidian Execute Code Plugin

This plugin allows you to execute code snippets in code blocks in your notes. The plugin adds a 'run' button for code blocks in supported languages. Clicking them results in the code of the block being executed. After the execution the result of the execution is showed. 

The result is shown only after the execution is finished. It is not possible to enter text on the command line into the
executed programm now.

![Video that shows how the plugin works.](https://github.com/twibiral/obsidian-execute-code/blob/master/images/execute_code_example.gif?raw=true)

## Supported programming languages

- JavaScript 
    - Requirements: Node.js is installed and the correct path is set in the settings.
    ```javascript
    function hello(name){
        console.log(`Hello ${name}!`);
    }
	
    hello("Bob")
    ```

- Python
	- Requirements: Python is installed and the correct path is set in the settings.
    ```python
    def hello(name):
        print("Hello", name)

    if __name__ == "__main__":
        hello("Eve")
    ```

	- Plots with matplotlib/seaborn are embedded in the note by default. You can turn this off in the settings.
    ```python
    import seaborn as sns
    import matplotlib.pyplot as plt
    sns.set_style("darkgrid")
    iris = sns.load_dataset('iris')
    sns.FacetGrid(iris, hue ="species",
        height = 5).map(plt.scatter,
        'sepal_length',
        'petal_length').add_legend()

    plt.show()
	```
  ![Example of an embedded plot.](https://github.com/twibiral/obsidian-execute-code/blob/master/images/plotting_example.png?raw=true)

- R
	- Requirements: R is installed and the correct path is set in the settings.
    ```r
    hello <- function(name){
        print(paste("Hello", name, sep = " "))
    }
	
    hello("Bob")
    ```
	- Plots can be embedded in the note by default. You can turn this off in the settings.
    ```r
	y = c(12, 15, 28, 17, 18)
	x = 1:length(y)
	plot(x, y, type="l")
    ```

- CPP
	- Requirements: NO requirements, works with [JSCPP](https://github.com/felixhao28/JSCPP).
	- Problems: No error handling implemented yet and JSCPP doesn't support all language features.
    ```cpp
    #include <iostream>
    using namespace std;

    void hello(char name[]) {
        cout << "Hello " << name << "!\n";
    }

    int main() {
        hello("Alice");
        return 0;
    }
    ```
  
- Shell
    - Requirements: Set the path to your preferred shell in the settings. Default is Bash.
    - Linux / MacOS: Probably works out-of-the-box.
    - Windows: Set path to `powershell`, add `-file` as argument, and change the default file ending to ``.ps1``.
    - Problems: Set the code box type to shell or bash, even when using powershell (see issue #24 for more information)
    ```shell
    echo "Hello World!"
    ls -la
    ```
	
- Prolog
   - Requirements: NO requirements, works with [Tau-Prolog](https://github.com/tau-prolog/tau-prolog).
   - Important: Add your queries after a line "`% query`" in the code block like in the following 
    ```prolog
    likes(john, pizza).
    likes(john, cheese).
    likes(jane, beer).
	
    % query
    likes(john, X).
    ```

- Groovy
	- Requirements: Groovy is installed and the correct path is set in the settings.
  ```groovy
        def hello(name){  
             println "Hello ${name}!" 
        }  
		
        def helloClosure = {  
           println "Hello ${it}!" 
        }  
		
        hello("Bob")
		
        helloClosure "Bob"
    ```
- Squiggle: For Squiggle support look at the [Obsidian Squiggle plugin](https://github.com/jqhoogland/obsidian-squiggle)
  by @jqhoogland.

Support for the following is planned:

- Java
- Matlab
- Julia Lang

Open for suggestions.

## Magic Commands

Magic commands are some meta commands that can be used in the code block. They are processed by the plugin before the
source code is executed.

The following magic commands are supported:

- `@vault`: Inserts the vault path as string.
- `@note`: Inserts the note path as string.
- `@title`: Inserts the note title as string.
- `@show(ImagePath)`: Displays an image at the given path in the note.
- `@show(ImagePath, Width, Height)`: Displays an image at the given path in the note.
- `@show(ImagePath, Width, Height, Alignment[center|left|right])`: Displays an image at the given path in the
  note.

(`@show(...)` is only supported for JavaScript and Python yet.)

![Example how to use the magic commands.](https://github.com/twibiral/obsidian-execute-code/blob/master/images/magic_example.png?raw=true)

## Running in Preview

Adding `run-` before the language name in the code blocks (as in the example below) renders the code block in the
preview already.
This allows you to execute the code in the preview.

```
```run-python
def hello(name):
print("Hello", name)

    if __name__ == "__main__":
        hello("Eve")
`````` 

## Installation

In your vault go to Settings > Community plugins > Browse and search for "Execute Code". Select the plugin, install it
and activate it.

or

Follow [this link](https://obsidian.md/plugins?search=execute%20code#) and click "Open in Obsidian".

## Warning
Do not execute code from sources you don't know or code you don't understand. Executing code can cause irrepairable damage.

## Known Problems
- Missing when `run` button after switching the theme: Try to close and reopen your notes and wait for a few minutes. It seems like obsidian doesn't call the postprocessors after the theme switch.

## Future Work
- Find better way to show that the program is running (for example a loading sign).
- Notebook Mode similar to Jupyter
- Global Declarations that make method and variable definitions available to subsequent code blocks
- Key combination to execute all code blocks in a file
- Error warning when the execution fails (e.g. when python isn't installed)
- Test if this plugin works in combination with dataview.

## Contribution
All contributions are welcome. Just create a merge request or email me: tim.wibiral(at)uni-ulm.de

The bullet points in Future Work are a good starting point if you want to help.

## Contributers
<a href="https://github.com/twibiral/obsidian-execute-code/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=twibiral/obsidian-execute-code" />
</a>



<sub>Made with [contrib.rocks](https://contrib.rocks).</sub>
