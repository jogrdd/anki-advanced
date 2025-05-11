# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Multiple export formats to Anki
    - Copy to clipboard with or without embedded image
    - Packaged deck
- Advanced card templates versionning
- More styling capability of card-reveal elements
- Elements copy & paste functionality with keyboard shortcuts (`Ctrl+C` and `Ctrl+V`)
- Elements offset in table and visual editor with keyboard shortcut (`Alt+Drag`)
- Contextual menu accessible with right-click or long press to activate functionalities like select, copy, paste, move, offset, ...
- Style templates
- Style customisation in table editor
- Media storage
- Card storage
- Import packaged deck from Anki
- Compatibility with native Image Occlusion
- Green mark when successfully revealed all items
- Progress bar on top of card-reval

### Changed
- Improved UI (blueprintjs.com, chakra-ui.com, ant.design, react.semantic-ui.com, rsuitejs.com, ...)

## [0.3] - 2025-05-11

### Added
- New logo
- Front page with a link to the editor

### Changed
- Transition to a full React project with a proper build system.

## [0.2] - 2025-05-03

### Added
- Allow bottom and right attributes when importing from HTML
- Download button to get Anki .apkg file containing a sample of each note type
- V2 Template files

### Changed
- Improved errors and warnings when importing from HTML (added references to element ID and more warnings)

### Fixed
- CSS label min-width and min-height forced to zero
- CSS template updated to reflect one in editor-poc.html
- Show mnemonic on reveal

## [0.1] - 2025-04-03

### Added
- Initial proof of concept for the Anki Advanced Cards editor.
- Basic functionality for creating and managing card-reveal elements.
    - Visual Editor with drag-and-drop functionality for card elements.
    - Table Editor for managing card elements in a tabular format.
    - HTML Editor for direct editing of card HTML.
    - Support for exporting card HTML for use in Anki.
    - Sequencing mask options for reveal elements.
- Settings modal for configuring global options and background settings.
    - Support for configurable options such as reversible, centered, and hideable elements.
    - Background image upload and management.
- Preview mode to view the card as it would appear in Anki.
- Export functionality to copy the generated HTML to the clipboard.
- Undo/Redo functionality with keyboard shortcuts (`Ctrl+Z` and `Ctrl+Y`).
- Error handling and validation for HTML imports.
