# Obsidian Execute Code Plugin

This plugin allows you to execute code snippets in code blocks in your notes. The plugin adds a 'run' button for code blocks in supported languages. Clicking them results in the code of the block being executed. After the execution the result of the execution is showed. An interactive input element is created when your code snippets reads expects user input.

The result is shown only after the execution is finished. It is not possible to enter text on the command line into the executed program now.

![Video that shows how the plugin works.](https://github.com/twibiral/obsidian-execute-code/blob/master/images/execute_code_example.gif?raw=true)

The following [languages are supported](#supported-programming-languages): CPP, Golang, Groovy, Kotlin, Java, JavaScript, TypeScript, Lua, CSharp, Prolog, Rust, Python, R, Shell, Powershell & Haskell.

Python and Rust support embedded plots. All languages support ["magic" commands](#magic-commands) that help you to access paths in obsidian or show images in your notes.

You can create code blocks that are executed before or after each code block of the same language and define [global code injections](#global-code-injection-and-reusing-code-blocks).

## Supported programming languages

- JavaScript
	- Requirements: Node.js is installed and the correct path is set in the settings.

```javascript
function hello(name) {
	console.log(`Hello ${name}!`);
}

hello("Bob")
```

- TypeScript
	- Requirements: Node.js installed then run in command line `npm install typescript -g` and `npm install ts-node -g`. (`-g` means global install)
	- Problems: If you use your global node.js installation and it doesn't work try to set your `ts-node` path in the settings to `npx ts-node` instead of `ts-node`.

```ts  
let message: string = 'Hello, World!';
console.log(message);  
```

- CSharp
	- Requirements: install dotnet core sdk and run in command line `dotnet tool install -g dotnet-script`, then config dotnet-script fullpath.

```cs 
Console.WriteLine("Hello, World!");  
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
sns.FacetGrid(iris, hue ="species", height = 5)
			  .map(plt.scatter, 'sepal_length', 'petal_length')
			  .add_legend()

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

- Java
	- Requirements: Java **11 or higher** is installed and the correct path is set in the settings.

```java
public class HelloWorld {
	public static void main(String[] args) {
		System.out.println("Hello World!");
	}
}
 ```

- Lua
	- Requirements: install lua and config lua path

```lua
print('Hello, World!')
```

- C++
	- Requirements: [Cling](https://github.com/root-project/cling) is installed and correct path is set in the settings.
	- Every code block must contain a main function.

```cpp
#include <iostream>
#include <string>

using namespace std;

void hello(string name) {
	cout << "Hello " << name << "!\n";
}

int main() {
	hello("Alice");
	return 0;
}
```

- Shell
	- Requirements: Set the path to your preferred shell in the settings. Default is Bash. (Only on Linux and macOS)

```shell
echo "Hello World!"
ls -la
```

- Powershell
	- Requirements: Set the path to your preferred shell in the settings. Default is Powershell. (Only on Windows)

```powershell
echo "Hello World!"
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

- Golang
	- Requirements: Golang is installed and correct path is set in the settings(`go` binary is available).
	- Every code block must contain package declaration and a main function.

```go
package main

import "fmt"
  
func main() {
	fmt.Println("Hello World")
}
 ```

- Rust
	- Requirements: Cargo is installed and correct path is set in the settings(`cargo` binary is available).
	- `cargo-eval` is installed. Install using `cargo install cargo-eval`.
	- Import statements and external crates is supported by `cargo-eval`. Read
	  their [documentation](https://github.com/reitermarkus/cargo-eval).
	- Every code block must a main function.

```rust
fn main() {
	println!("Hello World");
}
 ```

- Kotlin
	- Requirements: Kotlin is installed and correct path is set in the settings.

```kotlin
hello(name: String) {
	println("Hello $name!")
}

hello("Bob")
```

- Haskell
	- Requirements: Ghci is installed and correct path is set in the settings.
	- If you have a main function you have to manually call it.

```haskell
mySum:: Num a => a -> a -> a
mySum a b = a+b
```

- Squiggle: For Squiggle support look at the [Obsidian Squiggle plugin](https://github.com/jqhoogland/obsidian-squiggle) by @jqhoogland.

Support for the following is planned:

- Matlab
- Julia Lang

Open for suggestions.

## Magic Commands

Magic commands are some meta commands that can be used in the code block. They are processed by the plugin before the source code is executed.

The following magic commands are supported:

- `@vault`: Inserts the vault path as string.
- `@note`: Inserts the note path as string.
- `@title`: Inserts the note title as string.
- `@show(ImagePath)`: Displays an image at the given path in the note.
- `@show(ImagePath, Width, Height)`: Displays an image at the given path in the note.
- `@show(ImagePath, Width, Height, Alignment[center|left|right])`: Displays an image at the given path in the note.

(`@show(...)` is only supported for JavaScript and Python yet.)

![Example how to use the magic commands.](https://github.com/twibiral/obsidian-execute-code/blob/master/images/magic_example.png?raw=true)

## Running in Preview

Adding `run-` before the language name in the code blocks (as in the example below) renders the code block in the preview already.
This allows you to execute the code in the preview.

```
```run-python
def hello(name):
print("Hello", name)

    if __name__ == "__main__":
        hello("Eve")
`````` 

## Global Code Injection and Reusing Code Blocks

Sometimes it is helpful to have code that is executed before or after each other block of the same language. This plugin supports this in two ways:

### Global Injection in the Settings

All languages have a 'global inject' option in the settings that allows defining code to be added to the top of every single code block on a per-language basis. Code reuse fully works with all languages, and all existing magic commands, including showing images, and inline plot outputs. This can be used to define e.g. often used functions or import your favourite packages or libraries.

### Note-wide Pre- and Post-Code Blocks

You can add `Pre` before the language name to create a block that is executed before each following code block:

```
```pre-python
import pandas as pd
``````

This code block is added before each python block you define below in the note and import the pandas package.

`Post` blocks work the same way but the code in post blocks is executed _after_ your other code blocks.

Pre-/Post-blocks will only apply to code blocks defined below them, and will only apply to code blocks from the same language.

## Installation

In your vault go to Settings > Community plugins > Browse and search for "Execute Code". Select the plugin, install it and activate it.

or

Follow [this link](https://obsidian.md/plugins?search=execute%20code#) and click "Open in Obsidian".

## Warning

Do not execute code from sources you don't know or code you don't understand. Executing code can cause irreparable damage.

## Known Problems

- Missing when `run` button after switching the theme: Try to close and reopen your notes and wait for a few minutes. It seems like obsidian doesn't call the postprocessors after the theme switch.
- Pre- / Post-blocks may not be executed if the file contains duplicate code blocks.

## Future Work

- Find better way to show that the program is running (for example a loading sign).
- Notebook Mode similar to Jupyter
- Key combination to execute all code blocks in a file
- Error warning when the execution fails (e.g. when python isn't installed)
- Test if this plugin works in combination with dataview.

## Contribution

All contributions are welcome. Just create a merge request or email me: tim.wibiral(at)uni-ulm.de

The bullet points in Future Work are a good starting point if you want to help.

## Contributors

<a href="https://github.com/twibiral/obsidian-execute-code/graphs/contributors">
  <img alt="List of contributors to this project." src="https://contrib.rocks/image?repo=twibiral/obsidian-execute-code" />
</a>

<sub>Made with [contrib.rocks](https://contrib.rocks).</sub>
