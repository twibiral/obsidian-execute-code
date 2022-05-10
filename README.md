# Obsidian Execute Code Plugin

This plugin allows you to execute code snippets in code blocks in your notes. The plugin adds a 'run' button for code blocks in supported languages. Clicking them results in the code of the block being executed. After the execution the result of the execution is showed. 

The result is shown only after the execution is finished. It is not possible to enter text on the command line into the executed programm now.

![Video that shows how the plugin works.](https://github.com/twibiral/obsidian-execute-code/blob/master/execute_code_example.gif?raw=true)

## Supported programming languages

- JavaScript 
    - Requirements: Node.js is installed and the correct path is set in the settings.
- Python     
    - Requirements: Python is installed and the correct path is set in the settings.
- CPP
    - Requirements: NO requirements, works with [JSCPP](https://github.com/felixhao28/JSCPP).
    - Problems: No error handling implemented yet and JSCPP doesn't support all language features.

Support for the following is planned:
- Java
- Matlab

Open for suggestions.

## Warning
Do not execute code from sources you don't know or code you don't understand. Executing code can cause irrepairable damage.

## Future Work
- Find better way to show that the program is running (for example a loading sign).
