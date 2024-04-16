# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

## [Unreleased]

### Added
- Support for PHP (Thanks to @tlwt)


## [1.11.0]
### Added
- Support for OCaml (Thanks to @nieomylnieja)
- Support for Swift (Thanks to @ihomway)

### Changed
- Improved support for C compiler gcc (Thanks to @melo-afk)


## [1.10.0]
### Added
- Support for zig (Thanks to @slar)
- Support for enabling WSL Mode for the shell language only (Thanks to @mihai-vlc)

### Changed
- Update README.md


## [1.9.1]
### Changed
- Fix bug produced by duplicate labeled code blocks (Thanks to @qiaogaojian)

### Added
- Option for better handling of logs (Thanks to @qiaogaojian)
- Make labels work with code blocks with `run-` prefix (Thanks to @qiaogaojian)


## [1.9.0]
### Changed
- Fix app://local deprecation (New minimal Obsidian version: v1.2.8) (Thanks to @mayurankv)
- Fix Racket support (Thanks to @mayurankv)

### Added
- Support for Applescript (Thanks to @mayurankv)


## [1.8.1]
### Changed
- Update version support for C/C++. Add Working draft for ISO C++ 2020 for the C++ language. (Thanks to @drsect0r)

## [1.8.0]
### Added
- Support for Octave
- Support for Maxima

## [1.7.1]

### Changed

- Add more examples for magic commands to README.md
- Pass environmental variables to the REPL executors
- Allow language names that are not lower case

## [1.7.0]

### Added

- Support for SQL
- add info percent sign batch (Thanks to @hannesdelbeke)

### Changed
- Remove ANSI escape codes from `stderr`
- Add new executor for PowerShell that fixes problems with file encodings by encoding powershell scripts with latin-1 instead of windows-1252.K

## [1.6.2]

### Added

- Helpful docu for finding the path for a language (Thanks to @javascriptooo)

### Changed

- Fix wrong scala settings (Thanks to @scoopsdev)

## [1.6.1]

### Changed

- Fix magic commands @vault_path and @vault_url

## [1.6.0]

### Added

- New magic command `@theme` to get if obsidian is in dark or light mode (Thanks to @chlohal)
- New magic commands `@vault_path` and `@note_path` to get the path, and `@vault_url` and `@note_url` to get the url.
  They replace the old magic commands `@vault` and `@note`.
- Support for Racket (Thanks to @Ghexor)
- Support for F# (Thanks to @chlohal)
- Support for Dart (Thanks to @andremeireles)
- Support for Ruby (Thanks to @santry)
- Support for Batch scripts (Thanks to @hannesdelbeke)

## [1.5.0]
### Added
- Support for C (Thanks to @chlohal)

### Changed
- Fix the wrong options for wolframscript (Thanks to @davnn)
- Escape ANSI color codes in the output (Thanks to @chlohal)

## [1.4.0]
### Added
- Notebook mode for R (Thanks to @chlohal)
- Improved hiding of running indicator (Thanks to @chlohal and @ZackYJz)

### Changed
- Fix problem with the output boxes showing up (Thanks to @qiaogaojian)

## [1.3.0]
### Added
- WSL support (thanks to @clohal)

### Changed
- Fix bug where recursion didn't work and some parts of the code couldn't be executed (Python executor's usage of `exec`/`eval`) (thanks to @clohal)
- Fix formatting for the Scale section in the README.md (thanks to @cbarond)
- Fix mixed up mathematica settings (thanks to @clohal)
- Fix wrong setting for Mathematica
- Improve styles (thanks to @milan338)
- Refactor interactive executors to cut down on code reuse (thanks to @chlohal)
- Fix Error Notif on Success (thanks to @clohal)

## [1.2.0] - 2022-10-19
### Added
- Support for Scala (Thanks to @chlohal)
- Add run indicator to non-interactive blocks (Thanks to @milan338 and @chlohal)

### Changed
- Fix problems with runtimes and never hiding running indicators (Thanks to @milan338)

## [1.1.1] - 2022-10-18
### Changes
- Various bug fixes (Thanks to @chlohal)


## [1.1.0]
### Added
- Added Option to use either ghci or runghc. (Thanks to @afonsofrancof)
- `@html(...)` command and better HTML Handling. (Thanks to @chlohal and @milan338)
- Show indicator when block is running. (Thanks to @chlohal) 

### Changed
- Update Future Work section and add snap/flatpak/appimage problem to known issues. (Thanks to @chlohal)
- Fix python notebook mode freezing after showing a matplotlib plot. (Thanks to @milan338)
- Better output coloring to fix color problems with plugins like codemirror. (Thanks to @milan338)
- Fix JS notebook mode freezing when global injection is used. (Thanks to @chlohal)
- Fix Rust Execution to use `cargo eval` instead of `cargo run`. (Thanks to @chlohal)


## [1.0.0]

### Added

- 'Notebook Mode' for Python and JavaScript utilizing their respective REPL. (Thanks to @chlohal)
- Add command to run all blocks in a given file to the command palette. (Thanks to @chlohal)
- Support for Haskell. (Thanks to @afonsofrancof)

### Changed

- Changed syntax for Code injection via pre and post blocks. (Thanks to @milan338)
- Style of the run and clear buttons. (Thanks to @milan338)
- Updated the README and create collapsing layout. (Thanks to @milan338)

## [0.18.0]

### Added

- Support for Wolfram Mathematica

### Changed

- Quickfix for issues #77 and #81 by spawning always with Shell (Problems with spawning processes on Windows. This also
  affects #75, Security concern with spawning in shell.)
- Fix for #84

## [0.17.0] - 2022-09-24

### Added

- Support for interactive input blocks. That means code blocks can now read from stdin. (Thanks to @chlohal)

## [0.16.0] - 2022-09-24

### Added

- Support for TypeScript (Thanks to @qiaogaojian)
- Support for C# (Thanks to @qiaogaojian)
- Support for Lua (Thanks to @qiaogaojian)

## [0.15.2] - 2022-09-21

### Changed

- Changed project structure: Added node config and build files to root dir.
- Added documentation for every function.
- Fixed shell support.

## [0.15.1] - 2022-09-20

### Changed

- Refactored parts of the project and folder structure.
- Updated dependencies.
- Fixed issue #60 to fix the clear buttons.
- Quickfix for issue #59 by improving the regex.

## [0.15.0] - 2022-09-20

### Added

- Support for global code injections (thanks to @milan338).
- Support for Pre- and Post-Blocks that are executed before/after each code block in the same note (thanks to @milan338)

### Changed

- Improved C++ support by switching from JSCPP to Cling (thanks to @milan338).

## [0.14.0] - 2022-09-05

### Added

- Support for Kotlin (thanks to @Gluton-Official)

## [0.13.0] - 2022-09-02

### Added

- Add support for rust (thanks to @pspiagicw)
- Add support for Java
- Separate the implementation for Shell and Powershell
- Sanitize paths in the settings

## [0.12.1] - 2022-08-31

### Changed

- Improved Error handling
- Fix wrong executable in version 0.12.0

## [0.12.0] - 2022-08-31

### Added

- Support for Go

## [0.11.0] - 2022-08-30

### Added

- Support for R.
- Embedding R plots into notes.

## [0.10.0] - 2022-08-29

### Changed

- Fix errors that appear when code blocks are inserted to table cells (Issue #41 and #35).
- Improve style to fix issue #36.
- Improve logging.
- Refactoring
	- Extract Groovy execution to separate function.
	- Extract Button Listener handling to separate function.
	- Fix code smells.

### Added

- Add error messages to the output block.

## [0.9.2] - 22-08-29

### Changed

- Fix encoding for plots (thanks to @Thylane)

## [0.9.1] - 2022-07-31

### Changed

- Fix groovy

## [0.9.0] - 2022-07-31

### Added

- Magic Commands that can be added to source code to get new behavior tailored to obsidian.
	- `@show(ImagePath)`: Displays an image at the given path in the note.
	- `@show(ImagePath, Width, Height)`: Displays an image at the given path in the note.
	- `@show(ImagePath, Width, Height, Alignment["center"|"left"|"right"])`: Displays an image at the given path in the
	  note.
	- `@vault`: Inserts the vault path as string.
	- `@note`: Inserts the note path as string.
	- `@title`: Inserts the note title as string.
- Support for Groovy

### Changed

- Some refactoring and cleanup.

## [0.8.1] - 2022-06-24

### Changed

- Fix error when plotting.

## [0.8.0] - 2022-06-12

### Added

- Export to HTML when printing html code.
- PyPlots are automatically embedded as svg image into notes.

### Changed

- Improved settings tab.

## [0.7.0] - 2022-06-05

### Added

- Support for live preview. Adding `run-` before the language name in the code block renders the code block in the live
  preview. (Thanks to @rmchale)

## [0.6.0] - 2022-05-23

### Added

- Support for shell scripts (Thanks to @rmchale for the help)

## [0.5.3] - 2022-05-22

### Changed

- Fix persistent custom path (Thanks to @rmchale)
- Add running, done and error Notice to C++ and Prolog

## [0.5.2] - 2022-05-22

### Changed

- Fix issue #9. Works now on macOS too. (Thanks to @rmchale)

## [0.5.1] - 2022-05-22

### Changed

- Fix hardcoded Python path (Thanks to @vkmb)

## [0.5.0] - 2022-05-10

### Added

- Support for C++ (Using JSCPP)
- Support for Prolog (Using Tau-Prolog)

## [0.4.0] - 2022-04-23

### Added

- Support for Python
- Settings for command line options

### Changed

- Improved execution of JavaScript

## [0.3.2] - 2022-04-18

### Changed

- Fix markdown post processor
- Remove use of innerHTML

## [0.3.1] - 2022-04-18

### Added

- Changelog

### Changed

- Use `registerMarkdownProcessor` instead of a timed interval. (Thanks to @lishid for the suggestion.)
- Use promises instead of callbacks for creating and deleting files. (Thanks to @lishid for the suggestion.)
