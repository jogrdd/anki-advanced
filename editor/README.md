# Anki Advanced Cards - Card Editor Proof of Concept

This project is a proof of concept for creating a web-based card editor for Anki.

The goal is to provide an advanced and user-friendly interface for designing and managing Anki cards, with features that go beyond the native Anki templates.
The final version of this project will be a full React application, but for now, it is implemented as a single HTML page to explore the possibilities and gather feedback.

## Features

At this stage, the POC focuses on card-reveal feature, which allow users to click (sequencially or not) on elements in order to reveal part of the answer.

**Very Important**: the card-reveal works without any javascript. This is a pure HTML and CSS implementation based on checkbox status. It permit an easier integration to Anki without need for plugin development.

### Current Features

- **Visual Editor**: Drag-and-drop interface for positioning and resizing card-reveal elements
- **Table Editor**: Tabular interface for managing card elements with fields for labels, content, position, size, and options
- **HTML Editor**: Directly edit the HTML representation of the card for advanced customization
- **Configurable Options**:
  - Reversible reveal elements (allow or not to be hidden again, after reveal)
  - Centered or top-left origin for positioning
  - Hideable content after reveal
  - Customizable front and back styles (background and text colors)
- **Background Management**:
  - Upload custom background image
  - Clear or reset background data
- **History Management**: Undo and redo actions
- **Preview Mode**: View the card as it would appear in Anki
- **Export to Clipboard**: Copy the generated HTML for use in Anki
- **Keyboard Shortcuts**:
  - `Ctrl+Z`: Undo
  - `Ctrl+Y`: Redo

### Planned Features

- More styling (borders, ...)
- Per-item CSS editor
- Item's label offset
- Style templates
- Cards collection

## Project Structure

### Current State

The project is currently implemented as a single HTML file (`editor-poc.html`) that includes:
- Embedded React components for the editor.
- Inline CSS for styling.
- Babel for JSX compilation in the browser.
- ReactDOMServer for rendering the HTML preview.

### Anki Card Templates

The Anki card templates are stored in a separate folder. These templates are advanced alternatives to the native Anki templates and must be imported into Anki for use. They include features such as nice-looking cards, mnemonic, sources, reveal & sequencing functionality, and other customized styles.

## How to Use

1. Open the `editor-poc.html` file in a modern web browser.
2. Use the **Visual Editor** to drag, resize, and position elements on the card.
3. Use the **Table Editor** to fine-tune element properties.
4. Use the **HTML Editor** for advanced customization.
5. Configure global options and background settings in the **Settings** modal.
6. Preview the card using the **Preview Mode** toggle.
7. Export the card HTML using the **Copy to Clipboard** button.
8. Import the exported HTML into Anki along with the advanced templates.

## Known Limitations

- The current implementation is not optimized for production use.
- Babel is used for in-browser JSX compilation, which is slow and not suitable for large-scale applications.
- The editor does not support direct integration with AnkiWeb or AnkiDroid.
- Limited error handling and validation for user inputs.

## Future Plans

- Transition to a full React project with a proper build system.
- Add support for importing/exporting card data directly from Anki.
- Enhance the user interface with more intuitive controls and animations.
- Expand the feature set to include advanced card types and templates.

## Contributing

Contributions are welcome! If you have ideas, suggestions, or bug reports, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- [React](https://reactjs.org/) for the UI framework.
- [Anki](https://apps.ankiweb.net/) for the inspiration and card management system.
- [Babel](https://babeljs.io/) for enabling JSX in the browser.

---

**Note**: This is a proof of concept and is not intended for production use. The final version will be a standalone React application with enhanced features and performance.