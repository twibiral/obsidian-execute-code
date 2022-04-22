# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

## [Unreleased]
- Improved execution of JavaScript
- Added Matlab to supported languages

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
