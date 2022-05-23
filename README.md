# Obsidian Execute Code Plugin

This plugin allows you to execute code snippets in code blocks in your notes. The plugin adds a 'run' button for code blocks in supported languages. Clicking them results in the code of the block being executed. After the execution the result of the execution is showed. 

The result is shown only after the execution is finished. It is not possible to enter text on the command line into the executed programm now.

![Video that shows how the plugin works.](https://github.com/twibiral/obsidian-execute-code/blob/master/execute_code_example.gif?raw=true)

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
		print(name)

	if __name__ == "__main__":
		hello("Eve")
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
  
Support for the following is planned:
- Java
- Matlab
- Julia Lang
- R
- Bash / Shell

Open for suggestions.

## Installation
In your vault go to Settings > Community plugins > Browse and search for "Execute Code". Select the plugin, install it and activate it.

or

Follow [this link](https://obsidian.md/plugins?search=execute%20code#) and click "Open in Obsidian".

## Warning
Do not execute code from sources you don't know or code you don't understand. Executing code can cause irrepairable damage.

## Future Work
- Find better way to show that the program is running (for example a loading sign).
- Notebook Mode similar to Jupyter
- Global Declarations that make method and variable definitions available to subsequent code blocks
- Key combination to execute all code blocks in a file
- Overwrite python "plt.show()" to show the generated plot in the note (-> issue #13)
- Shortcuts to insert current path etc into the code block -> "@vault" / "@file" / "@file_name"
- Shortcut that can be used in a code blockto show any image or video in the note -> "@show(img)"

## Contribution
All contributions are welcome. Just create a merge request or send me an email to : tim.wibiral(at)uni-ulm.de
