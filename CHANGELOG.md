# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

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
