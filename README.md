# Obsidian Execute Code Plugin

This plugin allows you to execute code snippets in code blocks in your notes. The plugin adds a 'run' button for code blocks in supported languages. Clicking them results in the code of the block being executed. After the execution the result of the execution is showed. An interactive input element is created when your code snippets reads expects user input.

The result is shown only after the execution is finished. It is not possible to enter text on the command line into the executed program now.

![Video that shows how the plugin works.](https://github.com/twibiral/obsidian-execute-code/blob/master/images/execute_code_example.gif?raw=true)


The following [languages are supported](#supported-programming-languages-): C, CPP, Dart, Golang, Groovy, Kotlin, Java, JavaScript, TypeScript, Lean, Lua, CSharp, Prolog, Rust, Python, R, Ruby, Wolfram Mathematica, Haskell, Scala, Racket, F#, Batch, Shell & Powershell.


Python and Rust support embedded plots. All languages support ["magic" commands](#magic-commands-) that help you to access paths in obsidian or show images in your notes.

You can create code blocks that are executed before or after each code block of the same language and define [global code injections](#global-code-injection-and-reusing-code-blocks-).

Take a look at the [changelog](CHANGELOG.md) to see what has changed in recent versions.


[![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?color=1e1e1e&labelColor=8572db&label=Downloads&query=$['execute-code'].downloads&url=https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugin-stats.json&)](obsidian://show-plugin?id=execute-code)

## Supported programming languages 💻

<details>
<summary>JavaScript</summary>

- Requirements: Node.js is installed and the correct path is set in the settings.

```javascript
function hello(name) {
	console.log(`Hello ${name}!`);
}

hello("Bob")
```

- By default, Javascript runs in Notebook Mode. You can turn this off in the settings.

</details>
	
<details>
<summary>TypeScript</summary>

- Requirements: Node.js installed then run in command line `npm install typescript -g` and `npm install ts-node -g`. (`-g` means global install)
- Problems: If you use your global node.js installation and it doesn't work try to set your `ts-node` path in the settings to `npx ts-node` instead of `ts-node`.

```ts  
let message: string = 'Hello, World!';
console.log(message);  
```
</details>

<details>
<summary>CSharp</summary>

- Requirements: install dotnet core sdk and run in command line `dotnet tool install -g dotnet-script`, then config dotnet-script fullpath.

```cs 
Console.WriteLine("Hello, World!");  
```  
</details>

<details>
<summary>Dart</summary>

- Requirements: dart sdk is installed and the correct path is set in the settings.

```dart
void main() {
  print("Hello World");
}
```
</details>

<details>
<summary>Python</summary>

- Requirements: Python is installed and the correct path is set in the settings.

```python
def hello(name):
	print("Hello", name)

if __name__ == "__main__":
	hello("Eve")
```

- By default, Python runs in Notebook Mode. You can turn this off in the settings.
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
</details>	

<details>
<summary>R</summary>

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
</details>

<details>
<summary>Java</summary>

- Requirements: Java **11 or higher** is installed and the correct path is set in the settings.

```java
public class HelloWorld {
	public static void main(String[] args) {
		System.out.println("Hello World!");
	}
}
```
</details>

<details>
<summary>Lua</summary>

- Requirements: install lua and config lua path.

```lua
print('Hello, World!')
```
</details>

<details>
<summary>Lean</summary>

- Requirements: install lean and config lean path.

```lean
def main : IO Unit :=
  IO.println s!"Hello, World!"

#eval main
```
</details>

<details>
<summary>C++</summary>

- Requirements: [Cling](https://github.com/root-project/cling) is installed and correct path is set in the settings.
- Code will be executed line-by-line without needing a main function.

```cpp
#include <iostream>
#include <string>

using namespace std;

void hello(string name) {
	cout << "Hello " << name << "!\n";
}

hello("Alice);
```

- Main functions can be used as an entrypoint by toggling the option in settings.

```cpp
#include <iostream>

void main() {
	std::cout << "Hello, World!" << std::endl;
}
```
</details>

<details>
<summary>C</summary>

- Requirements: [Cling](https://github.com/root-project/cling) is installed and correct path is set in the settings.
- Code will be executed line-by-line without needing a main function.

```c
#include <stdio.h>

printf("Hello, World!");
```

- Main functions can be used as an entrypoint by toggling the option in settings.

```c
#include <stdio.h>

int main() {
	printf("Hello, World!");
	return 0;
}
```

</details>

<details>
<summary>Shell</summary>

- Requirements: Set the path to your preferred shell in the settings. Default is Bash. (Only on Linux and macOS)

```shell
echo "Hello World!"
ls -la
```
</details>

<details>
<summary>Powershell</summary>

- Requirements: Used to execute shell commands on Windows. Default is Powershell but can be set to your preferred shell in the settings.
- On MacOS: You probably need to change the command to use from `powershell` to `pwsh` in the plugin settings. Make sure you set the right path.

```powershell
echo "Hello World!"
```

- If you prefer batch: change the path settings in the menu for powershell
![Example how to use the magic commands.](https://github.com/twibiral/obsidian-execute-code/blob/master/images/batch_settings.png?raw=true)
</details>


<details>
<summary>Batch</summary>

- **Requirements**: Used to execute batch commands on Windows (also known as BAT or CMD). Default is command prompt, but can be set to your preferred shell in the settings.
- **Important**: <br>
	The percent sign is used in batch files to represent command line parameters: e.g. %1, %2, ... <br>
	Two percent signs in a batch file are treated like a single percent sign in a command: e.g. %%f <br>
	When using variables in execute code, use 2 percent signs. <br>
	
```batch
ECHO Hello World!
```
</details>


<details>
<summary>Prolog</summary>

- Requirements: NO requirements, works with [Tau-Prolog](https://github.com/tau-prolog/tau-prolog).
- Important: Add your queries after a line "`% query`" in the code block like in the following

```prolog
likes(john, pizza).
likes(john, cheese).
likes(jane, beer).

% query
likes(john, X).
```
</details>

<details>
<summary>Groovy</summary>

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
</details>

<details>
<summary>Golang</summary>

- Requirements: Golang is installed and correct path is set in the settings(`go` binary is available).
- Every code block must contain package declaration and a main function.

```go
package main

import "fmt"

func main() {
	fmt.Println("Hello World")
}
```
</details>

<details>
<summary>Rust</summary>

- Requirements: Cargo is installed and correct path is set in the settings(`cargo` binary is available).
- `cargo-eval` is installed. Install using `cargo install cargo-eval`.
- Import statements and external crates is supported by `cargo-eval`. Read
	their [documentation](https://github.com/reitermarkus/cargo-eval).
- Every code block must have a main function.

```rust
fn main() {
	println!("Hello World");
}
```
</details>

<details>
<summary>Kotlin</summary>

- Requirements: Kotlin is installed and correct path is set in the settings.

```kotlin
hello(name: String) {
	println("Hello $name!")
}

hello("Bob")
```
</details>

<details>
<summary>Wolfram Mathematica</summary>

- Requirements: Mathematica is installed and correct path is set in the settings.
- You can add `-cloud` as argument in the settings to use the Wolfram Cloud instead of the local installation.
</details>

<details>
<summary>Haskell</summary>

- You can either use <strong>runghc</strong> (compiler) or <strong>ghci</strong> (interpreter) to run your code.
  - <strong>runghc</strong> requirements:
  	- runghc and ghc are installed and correct paths are set in the settings.
    - Every code block must contain a main function.
  - <strong>ghci</strong>  requirements:
    - ghci is installed and correct path is set in the settings.
	- If you have a main function you have to manually call it.

```haskell
mySum:: Num a => a -> a -> a
mySum a b = a+b
```

</details>

<details>
<summary>Scala</summary>

- Requirements: Scala is installed and the correct path is set in the settings.

```scala
println("Hello, World!")
```

</details>

<details>
<summary>Racket</summary>

- Requirements: Racket is installed and the correct path is set in the settings.

```racket
"Hello, world!"
```
</details>

<details>
<summary>Ruby</summary>

- Requirements: Ruby is installed and the correct path is set in the settings.

```ruby
puts "Hello, World!"
```
</details>

Squiggle: For Squiggle support take a look at the [Obsidian Squiggle plugin](https://github.com/jqhoogland/obsidian-squiggle) by @jqhoogland.

Support for the following is planned:

- Matlab
- Julia Lang

Open for suggestions.

## Magic Commands 🪄

Magic commands are some meta commands that can be used in the code block. They are processed by the plugin before the source code is executed.

The following magic commands are supported:

- `@vault_path`: Inserts the vault path as string (e.g. "/User/path/to/vault")
- `@vault_url`: Inserts the vault url as string. (e.g. "app://local/path/to/vault")
- `@note_path`: Inserts the vault path as string (e.g. "/User/path/to/vault/Note.md")
- `@note_url`: Inserts the vault url as string. (e.g. "app://local/path/to/vault/Note.md")
- `@title`: Inserts the note title as string.
- `@show(ImagePath)`: Displays an image at the given path in the note.
- `@show(ImagePath, Width, Height)`: Displays an image at the given path in the note.
- `@show(ImagePath, Width, Height, Alignment[center|left|right])`: Displays an image at the given path in the note.
- `@html(HtmlSource)`: Displays HTML in the note

(`@show(...)` and `@html(...)` are only supported for JavaScript and Python yet.)
(The old commands `@note` and `@vault` are still supported, but may be removed in the future.)

![Example how to use the magic commands.](https://github.com/twibiral/obsidian-execute-code/blob/master/images/magic_example.png?raw=true)

## Running in Preview ⏩

Adding `run-` before the language name in the code blocks (as in the example below) renders the code block in the preview already.
This allows you to execute the code in the preview.

``````
```run-python
def hello(name):
print("Hello", name)

    if __name__ == "__main__":
        hello("Eve")
`````` 

## Code Block Arguments 🏷

Code blocks support specifying additional arguments in the form `{key='value', otherkey=['val1', 'val2']}`. Add them to code blocks like so:

`````
```python {label='my label'}
print('my labelled code block')
```
`````

## Global Code Injection and Reusing Code Blocks 📘

Sometimes it is helpful to have code that is executed before or after each other block of the same language. This plugin supports this in a few ways:

### Global Injection in the Settings

All languages have a 'global inject' option in the settings that allows defining code to be added to the top of every single code block on a per-language basis. Code reuse fully works with all languages, and all existing magic commands, including showing images, and inline plot outputs. This can be used to define e.g. often used functions or import your favourite packages or libraries.

### Note-wide Pre- and Post-Code Blocks

You can specify the `pre` argument to create a block that is executed before each following code block:

``````
```python {pre}
import pandas as pd
```
``````

This code block is added before each python block you define below in the note and import the pandas package.

`post` blocks work the same way, but the code in post blocks is executed _after_ your other code blocks.

Pre/Post blocks will only apply to code blocks defined below them, and will only apply to code blocks from the same language.

You can also have a pre and post block at the same time by specifying `{pre, post}`

Note, the `pre`/`post` arguments are special in that you don't need to explicitly state a key/value pair, however you can do so if you wish:

`{pre}` is equivalent to `{export='pre'}`, `{pre, post}` is equivalent to `{export=['pre', 'post']}`.

### Labelled Code Blocks

You can label specific code blocks with the `label='string'` argument, then import them explicitly in other blocks with the `import='string'` or `import=['string1', 'string2', ...]` argument so they aren't automatically imported as with pre / post blocks:

`````
```python {label='block 1'}
print('running block 1')
```

```python {label='block 2'}
print('running block 2')
```

```python {import=['block 1', 'block 2']}
print('should run block 1 and 2')
```
`````

Labelled code blocks will be executed before the code block being run, however after global injects and pre blocks.

### Ignoring Code Exports

In case you want to manually ignore specific exports in a code block like pre / post / global exports, you can do so with the `ignore` argument that accepts either `pre`, `post`, `global`, an array of any of these 3, or `all` to ignore all exports:

`````
```python {ignore='all'}
print('should not run any global injects or pre / post blocks')
```

```python {ignore=['global', 'pre']}
print('should not run any pre blocks or global injects')
```
`````

### Notebook Mode

A few languages (currently JS and Python) support *Notebook Mode*. If a language is using Notebook Mode (configurable in Settings), then all code blocks in a given file will execute in the same environment.

Variables functions, etc. defined in one code block will be available in other code blocks. Code blocks are executed on demand; the order of code blocks in the file does not affect the order in which they are executed:

``````
```js
console.log(f)
```
```js
let f = 3;
```
``````

Running the first code block, then the second, then the first again will give:

```
Uncaught ReferenceError: f is not defined
undefined
3
```

To manage the open runtimes for Notebook Mode, you can use the `Open Code Runtime Management` command in the command palette. From this sidebar window, you can stop kernels. **Note: force-stopping requires `taskkill` on Windows and `pkill` on Unix. 99% of systems should have these preinstalled: if yours doesn't, please [file an issue](https://github.com/twibiral/obsidian-execute-code/issues/new/choose)**


## Style Settings 🎨

This plugin supports customising styles using the [Style Settings plugin](https://github.com/mgmeyers/obsidian-style-settings). It's possible to customise the color of code block outputs and errors.

## Installation 💾

In your vault go to Settings > Community plugins > Browse and search for "Execute Code". Select the plugin, install it and activate it.

or

Follow [this link](https://obsidian.md/plugins?search=execute%20code#) and click "Open in Obsidian".
	

## Locating Path Settings ( ex. JavaScript | Node )
	
To avoid or resolve errors from an incorrect path.
	
('where' for Mac and Windows) --- (for Linux Users, replace 'where' with 'which')
	
1. In your terminal, type 'where node'
   ![Type 'where node' in terminal](https://github.com/twibiral/obsidian-execute-code/blob/master/images/path_location_shell.png?raw=true)
2. Copy path from terminal ( ex. /opt/homebrew/bin/node )
3. Paste in path under settings ( ex. Node path )
   ![Update path under settings with path from step 2](https://github.com/twibiral/obsidian-execute-code/blob/master/images/path_location_settings.png?raw=true)


## Warning ⚠

Do not execute code from sources you don't know or code you don't understand. Executing code can cause irreparable damage.

## Known Problems 🛠

- On Linux, Snap/Flatpak/AppImage installations of Obsidian run in an isolated environment. As such, they will not have access to any of your installed programs. If you are on Linux, make sure to install the `.deb` version of Obsidian. If your distro isn't compatible with `.deb` files, you may see issues.
- Missing when `run` button after switching the theme: Try to close and reopen your notes and wait for a few minutes. It seems like obsidian doesn't call the postprocessors after the theme switch.
- Pre- / Post-blocks may not be executed if the file contains duplicate code blocks.
- In Python, Embed Plots may not be off while Notebook Mode is on

## Future Work 📑

- Notebook Mode similar to Jupyter
- Error warning when the execution fails (e.g. when python isn't installed)
- Test if this plugin works in combination with dataview.

## Contribution 🤝

All contributions are welcome. Just create a merge request or email me: tim.wibiral(at)uni-ulm.de

The bullet points in Future Work are a good starting point if you want to help.

## Contributors ♥

<a href="https://github.com/twibiral/obsidian-execute-code/graphs/contributors">
  <img alt="List of contributors to this project." src="https://contrib.rocks/image?repo=twibiral/obsidian-execute-code" />
</a>

<sub>Made with [contrib.rocks](https://contrib.rocks).</sub>
