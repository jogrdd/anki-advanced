# Anki Advanced Cards - Card Editor Proof of Concept

This project is a proof of concept for creating a web-based card editor for Anki.

The goal is to provide an advanced and user-friendly interface for designing and managing Anki cards, with features that go beyond the native Anki templates.

## Features

At this stage, the POC focuses on card-reveal feature, which allow users to click (sequencially or not) on elements in order to reveal part of the answer.

**Important**: the legacy card-reveal type works without any JavaScript. This is a pure HTML and CSS implementation based on checkbox status. Next advanced card types will rely on JavaScript to provide more advanced features.

### Current Features

- **Visual Editor**: Drag-and-drop interface for positioning and resizing card-reveal elements.
- **Table Editor**: Tabular interface for managing card elements with fields for labels, content, position, size, and options.
- **HTML Editor**: Directly edit the HTML representation of the card for advanced customization.
- **Configurable Options**:
  - Reversible reveal elements (allow or not to be hidden again, after reveal).
  - Centered or top-left origin for positioning.
  - Hideable content after reveal.
  - Customizable front and back styles (background and text colors).
- **Background Management**:
  - Upload custom background image.
  - Clear or reset background data.
- **History Management**: Undo and redo actions with keyboard shortcuts (`Ctrl+Z` and `Ctrl+Y`).
- **Preview Mode**: View the card as it would appear in Anki.
- **Export to Clipboard**: Copy the generated HTML for use in Anki.
- **Sequencing Mask Options**: Visualize the order of reveal elements in the editor to help identify and fix sequencing issues.
- **Settings Modal**:
  - Configure global options such as reversible, centered, and hideable elements.
  - Manage background image settings.
- **Error Handling**: Basic validation for HTML imports.
- **Keyboard Shortcuts**:
  - `Ctrl+Z`: Undo.
  - `Ctrl+Y`: Redo.
  - `Ctrl+Click`: Toggle selection from visual editor.

## Project Structure

### Current State

The project is now implemented as a React application using React-Router and Vite. It is configured to be a single-page application (SPA) with a card editor page at `/anki-advanced/#/editor-poc`.
It can easily be run locally using Vite's development server or deployed to a static hosting service such as GitHub Pages.
The latest beta version is available at https://jogrdd.github.io/anki-advanced/#/editor-poc

### Anki Card Templates

The Anki card templates are stored in a separate folder. These templates are advanced alternatives to the native Anki templates and must be imported into Anki for use. They include features such as nice-looking cards, mnemonic, sources, reveal & sequencing functionality, and other customized styles.

## How to Use

1. Open the page in a modern web browser.
2. Use the **Visual Editor** to drag, resize, and position elements on the card.
3. Use the **Table Editor** to fine-tune element properties.
4. Use the **HTML Editor** for advanced customization.
5. Configure global options and background settings in the **Settings** modal.
6. Preview the card using the **Preview Mode** toggle.
7. Export the card HTML using the **Copy to Clipboard** button.
8. Import the HTML code into Anki note of type `Advanced (reveal)`
  - First add an image into the Back field
  - Then paste the HTML code into the Front field, except for the first `<div class="reveal-container ...">` and `<img>` tags
  - Add classes other than `reveal-container` to the RevealOptions field

## Known Limitations

- The current implementation is not optimized for production use.
- The editor does not support direct integration with AnkiWeb or AnkiDroid.
- Limited error handling and validation for user inputs.

## Contributing

Contributions are welcome! If you have ideas, suggestions, or bug reports, please open an issue or submit a pull request.

## License

This project is licensed under the GPL-3.0 License. See the LICENSE file for details.

## Acknowledgments

- [Anki](https://apps.ankiweb.net/) for the inspiration and card management system.
- [React](https://reactjs.org/) for the UI framework.
- [Vite](https://vitejs.dev/) for the development server and build tool.
- [React-Router](https://reactrouter.com/) for routing in the SPA.
---

**Note**: This is a proof of concept and is not intended for production use. The final version will be a standalone React application with enhanced features and performance.