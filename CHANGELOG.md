# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

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

- Fix issue #9. Works now on MacOS too. (Thanks to @rmchale)

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
