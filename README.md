# Obsidian Execute Code Plugin

This plugin allows you to execute code snippets in code blocks in your notes. The plugin adds a 'run' button for code blocks in supported languages. Clicking them results in the code of the block being executed. After the execution the result of the execution is showed. 

The result is shown only after the execution is finished. It is not possible to enter text on the command line into the executed programm now.

## Supported programming languages

- [x] JavaScript 
    - Requirements: Node.js is installed
    - Problems: Sometimes Node.js throws a random exception. Click run again and it works.

Support for the following is planned:
- [ ] Python3
- [ ] Python2
- [ ] Java

Open for suggestions.

## Warning
Do not execute code from sources you don't know or code you don't understand. Executing code can cause irrepairable damage.

## Future Work
- Find better way to show that the program is running (for example a loading sign).
- Insert run buttons on focus instead of time intervall.
