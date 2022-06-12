# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),


## [Unreleased]
### Changed
- Improved settings tab.

## [0.7.0] - 2022-06-05
### Added
- Support for live preview. Adding `run-` before the language name in the code block renders the code block in the live preview. (Thanks to @rmchale)

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
