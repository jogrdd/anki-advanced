import React, { type JSX } from 'react';
import ReactDOMServer from 'react-dom/server';
import DOMPurify from 'dompurify';
import './App.css';

interface Options {
  reversible: boolean;
  centered: boolean;
  hideable: boolean;
  front: string;
  back: string;
  'front-text': string;
  'back-text': string;
};

interface Background {
  filename?: string;
  data?: string | null;
}

interface Position {
  posX: string;
  posY: string;
  width: string;
  height: string;
}

interface Entry extends Position {
  selected: boolean;
  highlighted: boolean;
  label: string;
  content: string;
  options: string;
}

type EntryId = `${number}-${number}`;
type EntryGroup = Array<Entry>;
type Entries = Array<EntryGroup>;

interface EntryAction {
  create: [];
  update: [EntryId, Partial<Entry>];
}
interface SelectedEntryAction {
  group: [];
  isolate: [];
  move: ['up' | 'down'];
  delete: [];
}
interface HistoryValue {
  entries: Entries;
  options: Options;
  background: Background;
};

interface History {
  values: HistoryValue[];
  index: number;
  undo: boolean;
  redo: boolean;
};

interface ImportStatus {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
};


const APP_VERSION = '0.3';
const APP_TITLE = 'Anki - Advanced Card Editor';

const REGEX_TRAILING_ZEROS = /\.?0+$/;
const OPTION_CHOICES: OptionChoices = {
  centered: ['centered', 'not-centered'],
};
interface OptionChoices {
  centered: Array<'centered' | 'not-centered'>;
}

// Context for managing edit mode
type EditMode = 'visual' | 'html';
const EditMode = React.createContext<EditMode>('visual');

// Default configuration and options
function defaultEntryPosition(centered: boolean): Position {
  const newPosition = centered ? '50' : '45';
  return { posX: newPosition, width: '10', posY: newPosition, height: '10' };
}
function defaultEntry(centered: boolean): Entry {
  return { selected: true, highlighted: false, label: "", content: "", options: "", ...defaultEntryPosition(centered) };
}
const defaultEntries: Entries = [];
const defaultOptions: Options = {
  reversible: true,
  centered: true,
  hideable: false,
  front: 'white',
  back: 'white',
  'front-text': 'black',
  'back-text': 'black',
};
const optionValues = {
  front: ['white', 'black', 'transparent', 'gradient'],
  back: ['white', 'black', 'transparent', 'gradient'],
  'front-text': ['black', 'white', 'red'],
  'back-text': ['black', 'white', 'red'],
};
const defaultBackground: Background = { filename: "", data: "" };

// Raw CSS used by advanced reveal features, see https://docs.ankiweb.net/editing.html
const advancedCSS: string = `
  .card {
      height: 100vp;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      padding: 10px;
      box-sizing: border-box;

      font-family: arial;
      line-height: normal;
      font-size: 20px;
      text-align: center;
  }

  .header {
      color: grey;
      margin-bottom: 1em;
  }

  .frame {
      display: flex;
      flex-direction: column;
      background-color: white;
      border-radius: 15px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), 0 6px 20px rgba(0, 0, 0, 0.1);
  }

  .front {
      background-color: AliceBlue;
      border-top-left-radius: 15px;
      border-top-right-radius: 15px;
      border-bottom: 1px solid DarkSlateBlue;
      padding: 1em;
  }

  .front.reverse {
      background-color: MistyRose;
      border: 1px solid IndianRed;
  }

  .back {
      padding: 1em;
      flex: 4 1 5em;
  }

  .mnemonic:not(:empty) {
      position: relative;
      background-color: LightYellow;
      border-bottom-left-radius: 15px;
      border-bottom-right-radius: 15px;
      border-top: 1px solid Wheat;
      padding: 0.5em;
      padding-top: 1em;
  }
  .mnemonic:not(:empty):before {
      content: "💡";
      text-align: left;
      position: absolute;
      left: 50%;
      top: -0.6em;
      transform: translateX(-50%);
  }

  .source {
      position: relative;
      font-size: small;
      margin-top: 1em;
      margin-bottom: 0.5em;
      align-self: flex-end;
  }

  .source a {
      text-decoration: none;
  }

  .source > .default a:not(:empty):before {
      content: "🔗 "
  }

  ul,ol,td {
      text-align: left;
  }

  .front hr,
  .back hr,
  .mnemonic hr
  {
      position: relative;
      left: -1em;
      width: calc(100% + 2em);
      border: none;
      border-top: 1px solid LightGrey;
  }
`;
const revealCSS = `
  /****** REVEAL FUNCTIONALITY ******/
  /* USAGE

  - Add an image with class "reveal-background":

  <img class="reveal-background" src="{{Src}}">

  - For each reveal element, add the following HTML:

  <div class="reveal {{hint round border centered}}" style="top: {{Top}}; left: {{Left}}; height: {{Height}}; width: {{Width}};">
    <input id="{{ID}}" type="checkbox"></input>
    <label for="{{ID}}">{{Label}}</label>
    <div>{{Content}}</div>
  </div>

  - A generator is available at https://docs.google.com/spreadsheets/d/10xOEICIvBzzAa8FtoUb2MYhJlJLE-AfpuX9IoUlIQ0I/edit?usp=sharing

  - If not used in a reveal card type, manually add the following HTML around reveal items:

  <div class="reveal-container {{revealed centered reversible hideable front/back-gradient/transparent front/back-text-white/red}}">{...}</div>

  */

  .reveal-container {
      position: relative;
      margin: 0;
      padding: 0;
      user-select: none;
  }

  .reveal-container .reveal-background {
      display: block;
      width: 100%;
      height: auto;
      pointer-events: none;
  }
  .reveal-container img.reveal-background {
      max-width: 100%;
  }

  .reveal-container > :not(.reveal-background):not(.reveal-sequencing):not(.reveal) {
      display: none;
  }

  .reveal-container .reveal {
      position: absolute;
      margin: 0;
      padding: 0;
      z-index: 1;
  }

  .reveal-container .reveal > input {
      margin-left:-99999px;
  }

  .reveal-container .reveal > input + label,
  .reveal-container .reveal > input + label + div
  {
      display: flex;
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      z-index: 1;
  }

  /* NOT CHECKED */

  .reveal-container:not(.revealed) .reveal:not(.revealed) > input:not(:checked) + label + div,
  .reveal-container .reveal.revealed > input:checked + label + div,
  .reveal-container.revealed .reveal > input:checked + label + div
  {
      display: none;
  }

  /* CHECKED or REVEALED */

  .reveal-container:not(.revealed) .reveal:not(.revealed) > input:checked + label,
  .reveal-container .reveal.revealed > input:not(:checked) + label,
  .reveal-container.revealed .reveal > input:not(:checked) + label
  {
      opacity: 0;
  }

  .reveal-container:not(.revealed) .reveal:not(.revealed) .on-reveal {
    display: none;
  }

  /* DEFAULT LOOK */

  .reveal-container .reveal * {
      box-sizing: border-box;
      -moz-box-sizing: border-box;
      -webkit-box-sizing: border-box;
      margin: 0;
      padding: 0;
      min-width: 0;
      min-height: 0;
      box-shadow: none;
      padding-inline: 0;
      border-radius: 0;
  }

  .reveal-container .reveal > input + label,
  .reveal-container .reveal > input + label + div {
      outline: none;
      justify-content: center;
      align-items: center;
      text-align: center;
      font-size: 2.5vw;
      background: white;
      border: none;
  }

  .reveal-container .reveal > input + label,
  .reveal-container .reveal > input + label + div,
  .reveal-container .reveal > input + label.text-black,
  .reveal-container .reveal.front-text-black > input + label,
  .reveal-container.front-text-black .reveal > input + label,
  .reveal-container .reveal > input + label + div.text-black,
  .reveal-container .reveal.back-text-black > input + label + div,
  .reveal-container.back-text-black .reveal > input + label + div
  {
      color: black;
      text-shadow: -1px -1px 1px white, 1px -1px 1px white, -1px 1px 1px white, 1px 1px 1px white;
  }

  /* ADDITIONAL LOOKS */
  .reveal-container .reveal > input + label.black,
  .reveal-container .reveal.front-black > input + label,
  .reveal-container.front-black .reveal > input + label,
  .reveal-container .reveal > input + label + div.black,
  .reveal-container .reveal.back-black > input + label + div,
  .reveal-container.back-black .reveal > input + label + div
  {
      background: black;
      border: none;
  }
  
  .reveal-container .reveal > input + label.gradient,
  .reveal-container .reveal.front-gradient > input + label,
  .reveal-container.front-gradient .reveal > input + label,
  .reveal-container .reveal > input + label + div.gradient,
  .reveal-container .reveal.back-gradient > input + label + div,
  .reveal-container.back-gradient .reveal > input + label + div
  {
      background: radial-gradient(circle, white, transparent);
      border: none;
  }

  .reveal-container .reveal > input + label.transparent,
  .reveal-container .reveal.front-transparent > input + label,
  .reveal-container.front-transparent .reveal > input + label,
  .reveal-container .reveal > input + label + div.transparent,
  .reveal-container .reveal.back-transparent > input + label + div,
  .reveal-container.back-transparent .reveal > input + label + div
  {
      background: transparent;
      border: none;
  }

  .reveal-container .reveal > input + label.text-white,
  .reveal-container .reveal.front-text-white > input + label,
  .reveal-container.front-text-white .reveal > input + label,
  .reveal-container .reveal > input + label + div.text-white,
  .reveal-container .reveal.back-text-white > input + label + div,
  .reveal-container.back-text-white .reveal > input + label + div
  {
      color: white;
      text-shadow: -1px -1px 1px black, 1px -1px 1px black, -1px 1px 1px black, 1px 1px 1px black;
  }

  .reveal-container .reveal > input + label.text-red,
  .reveal-container .reveal.front-text-red > input + label,
  .reveal-container.front-text-red .reveal > input + label,
  .reveal-container .reveal > input + label + div.text-red,
  .reveal-container .reveal.back-text-red > input + label + div,
  .reveal-container.back-text-red .reveal > input + label + div
  {
      color: red;
      text-shadow: -1px -1px 1px black, 1px -1px 1px black, -1px 1px 1px black, 1px 1px 1px black;
  }

  /* CENTERED feature */

  .reveal-container .reveal.centered,
  .reveal-container.centered .reveal:not(.not-centered)
  {
      transform: translateX(-50%) translateY(-50%);
  }

  /* SEQUENCING feature */

  .reveal-container .reveal-sequencing {
    background: transparent;
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    z-index: 1;
    display: none;
  }

  .reveal-container:not(.revealed) .reveal-sequencing:has(~ .reveal:not(.revealed) > input:not(:checked) + label)
  {
    display: block;
  }

  /* REVERSIBLE feature */

  .reveal-container .reveal > input:checked + label.reversible,
  .reveal-container .reveal.reversible > input:checked + label,
  .reveal-container.reversible .reveal > input:checked + label,
  .reveal-container .reveal.revealed > input:not(:checked)+ label.reversible,
  .reveal-container .reveal.revealed.reversible > input:not(:checked) + label,
  .reveal-container.reversible .reveal.revealed > input:not(:checked) + label,
  .reveal-container.revealed .reveal > input:not(:checked)+ label.reversible,
  .reveal-container.revealed .reveal.reversible > input:not(:checked) + label,
  .reveal-container.revealed.reversible .reveal > input:not(:checked) + label
  {
      z-index: 2;
  }

  /* HIDEABLE feature */

  .reveal-container .reveal.revealed > input:not(:checked)+ label.hideable,
  .reveal-container .reveal.revealed.hideable > input:not(:checked) + label,
  .reveal-container.hideable .reveal.revealed > input:not(:checked) + label,
  .reveal-container.revealed .reveal > input:not(:checked)+ label.hideable,
  .reveal-container.revealed .reveal.hideable > input:not(:checked) + label,
  .reveal-container.revealed.hideable .reveal > input:not(:checked) + label
  {
      z-index: 2;
  }

  .reveal-container .reveal.revealed > input:checked + label.hideable,
  .reveal-container.revealed .reveal > input:checked + label.hideable,
  .reveal-container .reveal.revealed.hideable > input:checked + label,
  .reveal-container.revealed .reveal.hideable > input:checked + label,
  .reveal-container.hideable .reveal.revealed > input:checked + label,
  .reveal-container.revealed.hideable .reveal > input:checked + label
  {
      opacity: 0;
  }
`;

/* Entries helper */
function mapEntries(
  entries: Entries,
  fn: (entry: Entry, entryIndex: number, groupIndex: number) => Entry
): Entries {
  return entries.map((group, groupIndex) =>
    group.map((entry, entryIndex) => fn(entry, entryIndex, groupIndex))
  );
}
function forEachEntries(
  entries: Entries,
  fn: (entry: Entry, entryIndex: number, groupIndex: number) => void
): void {
  entries.forEach((group, groupIndex) => {
    group.forEach((entry, entryIndex) => {
      fn.call(null, entry, entryIndex, groupIndex);
    });
  });
}

/* Generic filters */
function notNullFilter(v: unknown): boolean {
  return (v !== null);
}

function entryId(groupIndex: number, entryIndex: number): EntryId {
  return [groupIndex, entryIndex].join('-') as `${number}-${number}`;
}

/**
 * Toolbar component
 * Provides buttons for reset, export, undo, redo, and settings
 */
function Toolbar({ onReset, onExport, history, onUndo, onRedo, onOpenSettings }: {
  onReset: () => void;
  onExport: () => void;
  history: { undo: boolean; redo: boolean };
  onUndo: () => void;
  onRedo: () => void;
  onOpenSettings: () => void;
}): JSX.Element {
  const editMode = React.use(EditMode);

  return (
    <div className="toolbar">
      <button type='button'><a download className="button" href="./Advanced Note Types.apkg">Download</a></button>
      <div className="button-group">
        <button type='button' onClick={onReset}>Reset</button>
        <button type='button' onClick={onExport} disabled={editMode != 'visual'}>Copy to Clipboard</button>
      </div>
      <div className="button-group">
        <button type='button' onClick={onUndo} disabled={editMode != 'visual' || !history.undo}>Undo</button>
        <button type='button' onClick={onRedo} disabled={editMode != 'visual' || !history.redo}>Redo</button>
      </div>
      <button type='button' onClick={onOpenSettings}>Settings</button>
    </div>
  );
}

/**
 * TableEditorEntry component
 * Represents a single row in the table editor
 */
function TableEditorEntry({ id, selected, highlighted, label, content, posX, posY, width, height, options, onChange, onHighlight, onSaveHistory }: {
  id: EntryId;
  selected: boolean;
  highlighted: boolean;
  label: string;
  content: string;
  posX: string;
  posY: string;
  width: string;
  height: string;
  options: string;
  onChange: <K extends keyof Entry>(id: EntryId, field: K, value: Entry[K]) => void;
  onHighlight: (value: boolean) => void;
  onSaveHistory: () => void;
}): JSX.Element {
  const editing = React.useRef(false);
  const editMode = React.use(EditMode);

  const handleInputFocus = () => {
    editing.current = false;
  };
  
  const inputChangeHandler = (field: keyof Entry) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editing.current) {
        editing.current = true;
        onSaveHistory();
      }
      
      if (field === 'options') {
        const newOptions = e.target.value.split(' ').filter(Boolean);
        const newCentered = OPTION_CHOICES.centered.some(v => newOptions.includes(v));
        const newValue = [(newCentered ? null : optionSelectValue('centered')), ...newOptions].filter(Boolean).join(' ') + (e.target.value.endsWith(' ') ? ' ' : '');
        onChange(id, field, newValue);
      } else {
        onChange(id, field, e.target.value);
      }
    }
  };

  const optionChangeHandler = (field: keyof OptionChoices) => {
    const choices = OPTION_CHOICES[field];
    return (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
      const value = e.target.value;
      // Clean options string and append value if not already present
      const newOptions = [...new Set([...options.split(' ').filter(Boolean), value])].filter(o => {
        return (o === value) || !(choices as string[]).includes(o);
      }).join(' ');
      // onChange option string
      onSaveHistory();
      onChange(id, 'options', newOptions);
    }
  };

  const optionSelectValues = (field: keyof OptionChoices) => ['', ...OPTION_CHOICES[field]];
  const optionSelectValue = (field: keyof OptionChoices) => {
    const optionsList = options.split(' ').filter(Boolean);
    return OPTION_CHOICES[field].find(v => optionsList.includes(v)) || '';
  }
  const optionValue = () => {
    const choices = Object.values(OPTION_CHOICES).flat();
    return options.split(' ').filter(Boolean).filter(o => !choices.includes(o)).join(' ') + (options.endsWith(' ') ? ' ' : '');
  };


  return (
    <tr className={highlighted? 'highlighted' : selected ? 'selected' : ''} onMouseEnter={() => { onHighlight(true); }} onMouseLeave={() => { onHighlight(false); }}>
      <td><label><input type="checkbox" checked={selected} onChange={(e) => { onChange(id, 'selected', e.target.checked); }} /></label></td>
      <td><input type="text" value={label} onChange={inputChangeHandler('label')} onFocus={handleInputFocus} disabled={editMode != 'visual'} /></td>
      <td><input type="text" value={content} onChange={inputChangeHandler('content')} onFocus={handleInputFocus} disabled={editMode != 'visual'} /></td>
      <td><input type="text" value={posX} onChange={inputChangeHandler('posX')} onFocus={handleInputFocus} disabled={editMode != 'visual'} /></td>
      <td><input type="text" value={posY} onChange={inputChangeHandler('posY')} onFocus={handleInputFocus} disabled={editMode != 'visual'} /></td>
      <td><input type="text" value={width} onChange={inputChangeHandler('width')} onFocus={handleInputFocus} disabled={editMode != 'visual'} /></td>
      <td><input type="text" value={height} onChange={inputChangeHandler('height')} onFocus={handleInputFocus} disabled={editMode != 'visual'} /></td>
      <td><OptionSelect values={optionSelectValues('centered')} value={optionSelectValue('centered')} defaultValue={''} onChange={optionChangeHandler('centered')} /></td>
      <td><input type="text" value={optionValue()} onChange={inputChangeHandler('options')} onFocus={handleInputFocus} disabled={editMode != 'visual'} /></td>
    </tr>
  );
}

/**
 * Config component
 * Allows configuration of global options and background settings
 */
function Config({ options, background, onChange, onBackgroundChange, onSaveHistory }: {
  options: Options;
  background: Background;
  onChange: <K extends keyof Options>(action: K, value: Options[K]) => void;
  onBackgroundChange: (data: Background) => void;
  onSaveHistory: () => void;
}) {
  const editing = React.useRef(false);
  const editMode = React.use(EditMode);

  const handleInputFocus = () => {
    editing.current = false;
  };

  const backgroundUploader = React.useRef<HTMLInputElement>(null);

  const handleBackgroundDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSaveHistory();
        onBackgroundChange({ filename: file.name, data: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadBackground = () => {
    backgroundUploader.current?.click();
  };

  const handleBackgroundFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editing.current) {
      editing.current = true;
      onSaveHistory();
    }
    onBackgroundChange({ filename: e.target.value });
  };

  const handleClearBackgroundData = () => {
    onSaveHistory();
    onBackgroundChange({ data: '' });
  };

  const checkboxHandler = (action: keyof Options) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      onSaveHistory();
      onChange(action, e.target.checked);
    };
  };

  const selectHandler = (action: keyof Options) => {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      onSaveHistory();
      onChange(action, e.target.value);
    };
  };

  return (
    <>
      <h3>Background Image</h3>
      <div className="button-group">
        <label htmlFor="settings-src">
          <span>{ background.data ? 'Filename' : 'URL' }</span>
        </label>
        <input type="file" accept="image/*" ref={backgroundUploader} onChange={handleBackgroundDataChange} hidden />
        <input id="settings-src" type="text" value={background.filename} onChange={handleBackgroundFilenameChange} onFocus={handleInputFocus} disabled={editMode != 'visual'} />
      </div>
      <div className="button-group">
        <button type='button' onClick={handleUploadBackground}>Upload</button>
        <button type='button' onClick={handleClearBackgroundData} disabled={!background.data}>Clear Data</button>
      </div>

      <h3>Global options</h3>
      <div>
        <label className="button"><input type="checkbox" checked={options.reversible} onChange={checkboxHandler('reversible') } disabled={editMode != 'visual'} /><span>Reversible</span></label>
        <label className="button"><input type="checkbox" checked={options.centered} onChange={checkboxHandler('centered') } disabled={editMode != 'visual'} /><span>Centered</span></label>
        <label className="button" title="Once revealed, content can be hidden"><input type="checkbox" checked={options.hideable} onChange={checkboxHandler('hideable') } disabled={editMode != 'visual'} /><span>Hideable</span></label>
      </div>
      <div>
        <h4>Question style</h4>
        <div className="button-group">
          <label><span>Background</span></label>
          <OptionSelect value={options['front']} values={optionValues['front']} defaultValue={defaultOptions['front']} onChange={selectHandler('front')} />
        </div>
        <div className="button-group">
          <label><span>Text</span></label>
          <OptionSelect value={options['front-text']} values={optionValues['front-text']} defaultValue={defaultOptions['front-text']} onChange={selectHandler('front-text')} />
        </div>
      </div>
      <div>
        <h4>Answer style</h4>
        <div className="button-group">
          <label><span>Background</span></label>
          <OptionSelect value={options['back']} values={optionValues['back']} defaultValue={defaultOptions['back']} onChange={selectHandler('back')} />
        </div>
        <div className="button-group">
          <label><span>Text</span></label>
          <OptionSelect value={options['back-text']} values={optionValues['back-text']} defaultValue={defaultOptions['back-text']} onChange={selectHandler('back-text')} />
        </div>
      </div>
    </>
  );
}

/**
 * OptionSelect component
 * Dropdown for selecting options
 */
function OptionSelect({value, values, defaultValue, onChange}: {
  value: string;
  values: string[];
  defaultValue: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}): JSX.Element {
  const editMode = React.use(EditMode);

  return (
    <select value={value} onChange={onChange} disabled={editMode != 'visual'}>
      {values.map((v) => <option key={v} value={v}>{ [v.charAt(0).toUpperCase() + v.slice(1), v === defaultValue ? '(default)' : null].filter(Boolean).join(' ') }</option> )}
    </select>
  );
}

/**
 * TableEditor component
 * Displays a table for managing card elements
 */
function TableEditor({ entries, onChange, onChangeSelected, onSaveHistory }: {
  entries: Entries;
  onChange: <K extends keyof EntryAction>(action: K, ...args: EntryAction[K]) => void;
  onChangeSelected: <K extends keyof SelectedEntryAction>(action: K, ...args: SelectedEntryAction[K]) => void;
  onSaveHistory: () => void;
}) {
  const [selectAllChecked, setSelectAllChecked] = React.useState(false);
  const [selectAllIndeterminate, setSelectAllIndeterminate] = React.useState(false);
  const [selectedCount, setSelectedCount] = React.useState(0);
  const [firstSelected, setFirstSelected] = React.useState(false);
  const [lastSelected, setLastSelected] = React.useState(false);

  const editMode = React.use(EditMode);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAllChecked(checked);
    setSelectAllIndeterminate(false);
    forEachEntries(entries, (_entry, entryIndex, groupIndex) => { onChange('update', entryId(groupIndex, entryIndex), { selected: checked }); });
  };

  const handleDeselectAll = () => {
    forEachEntries(entries, (_entry, entryIndex, groupIndex) => { onChange('update', entryId(groupIndex, entryIndex), { selected: false }); });
  };

  const handleHighlight = (id: EntryId, value: boolean) => { onChange('update', id, { highlighted: value }); };

  React.useEffect(() => {
    const flattenEntries = entries.flat();
    const totalEntries = flattenEntries.length;
    const count = flattenEntries.filter(entry => entry.selected).length;
    setSelectedCount(count);

    if (count === 0) {
      setSelectAllChecked(false);
      setSelectAllIndeterminate(false);
    } else {
      setFirstSelected(flattenEntries[0].selected);
      setLastSelected(flattenEntries[totalEntries-1].selected);
      if (count === totalEntries) {
        setSelectAllChecked(true);
        setSelectAllIndeterminate(false);
      } else {
        setSelectAllChecked(false);
        setSelectAllIndeterminate(true);
      }
    }
  }, [entries]);

  const addEntry = () => { onSaveHistory(); onChange('create'); };

  const selectedEntriesHandler = <K extends keyof SelectedEntryAction>(action: K, ...args: SelectedEntryAction[K]) => {
    return () => { onSaveHistory(); onChangeSelected(action, ...args); };
  }

  return (
    <div id="table-editor" className={['app-panel', editMode === 'visual' ? 'sticky' : null].filter(Boolean).join(' ')}>
      <h2>Entries</h2>
      <div style={{maxHeight: '256px', overflowX: 'auto'}}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 0 }}>
                <label><input type="checkbox" checked={selectAllChecked} ref={el => { if (el) el.indeterminate = selectAllIndeterminate; }} onChange={handleSelectAll} /></label>
              </th>
              <th style={{ width: '30%' }}>Label</th>
              <th style={{ width: '30%' }}>Content</th>
              <th style={{ width: '10%' }} colSpan={2}>Position X-Y (%)</th>
              <th style={{ width: '10%' }} colSpan={2}>Size W-H (%)</th>
              <th style={{ width: '20%' }} colSpan={2}>Options</th>
            </tr>
          </thead>
          {entries.map((entry, groupIndex) => (
            <tbody key={groupIndex}>
              {entry.map((entry, index) => (
                <TableEditorEntry
                  key={index}
                  id={entryId(groupIndex, index)}
                  {...entry}
                  onChange={(id, field, value) => { onChange('update', id, { [field]: value }); }}
                  onHighlight={(value) => { handleHighlight(entryId(groupIndex, index), value); }}
                  onSaveHistory={onSaveHistory}
                />
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <div className="toolbar">
        <span>{selectedCount} rows selected (<a className="button" onClick={handleDeselectAll}>clear</a>) - </span>
        <div className="button-group">
          <button type="button" onClick={selectedEntriesHandler('group')} disabled={editMode != 'visual' || !selectedCount}>Group</button>
          <button type="button" onClick={selectedEntriesHandler('isolate')} disabled={editMode != 'visual' || !selectedCount}>Isolate</button>
        </div>

        <div className="button-group">
          <button type="button" onClick={selectedEntriesHandler('move', 'up')} disabled={editMode != 'visual' || !selectedCount || firstSelected}>Move Up</button>
          <button type="button" onClick={selectedEntriesHandler('move', 'down')} disabled={editMode != 'visual' || !selectedCount || lastSelected}>Move Down</button>
        </div>

        <button type="button" onClick={selectedEntriesHandler('delete')} disabled={editMode != 'visual' || !selectedCount}>Remove</button>

        <button type="button" onClick={addEntry} disabled={editMode != 'visual'}>Add</button>
      </div>
    </div>
  );
}

/**
 * Generate options string
 */
const formatOptions = (options: Options): string[] => Object.keys(options).map((key) => {
  const value = options[key as keyof Options];
  if (value === true) return key;
  if (typeof value === 'string' && value.length && value !== defaultOptions[key as keyof Options]) return [key, value].join('-');
  return null;
}).filter(value => value !== null);

const sanitizeHtml = (str: string): string => {
  if (!DOMPurify.isSupported) throw new Error('DOMPurify is not supported in this environment');
  const config = {
    USE_PROFILES: {html: true},
  };
  return DOMPurify.sanitize(str, config);
};

function SanitizedHtmlElement({ element, html }: {
  element: JSX.Element;
  html: string;
}): JSX.Element {
  // eslint-disable-next-line react-x/no-clone-element
  return React.cloneElement(element, { dangerouslySetInnerHTML: { __html: sanitizeHtml(html) } });
}

/**
 * VisualEditor component
 * Provides a drag-and-drop interface for editing card elements
 */
function VisualEditor({ entries, options, background, onEntryChange, onSaveHistory }: {
  entries: Entries;
  options: Options;
  background: Background;
  onEntryChange: <K extends keyof EntryAction>(action: K, ...args: EntryAction[K]) => void;
  onSaveHistory: () => void;
}): JSX.Element {
  const [revealed, setRevealed] = React.useState(false);
  const [highlightedElement, setHighlightedElement] = React.useState<VisualElement|null>(null);
  const [snapToGrid, setSnapToGrid] = React.useState({gridSize: 1, decimals: 0});

  const editMode = React.use(EditMode);
  const [preview, setPreview] = React.useState(false);
  const [sequencingMask, setHighlightSequencing] = React.useState('disabled');

  const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x));

  interface Coordinates {
    x: number;
    y: number;
  }

  interface Size {
    width: number;
    height: number;
  }
  interface MousePosition extends Coordinates {
    e: React.MouseEvent;
    ref: HTMLElement;
    left: number;
    right: number;
    top: number;
    bottom: number;
  }

  const getMousePosition = (e: React.MouseEvent, ref: HTMLElement): MousePosition => {
    if (!(e.target instanceof HTMLElement)) throw new Error('Target is not an HTMLElement');

    const target = e.target;
    const rect = ref.getBoundingClientRect();
    const distances = {
      left: e.clientX - rect.left - target.clientLeft,
      right: rect.left - target.clientLeft + rect.width - e.clientX,
      top: e.clientY - rect.top - target.clientTop,
      bottom: rect.top - target.clientTop + rect.height - e.clientY,
    };
    return {
      e,
      ref,
      x: clamp(distances.left / rect.width * 100, 0, 100),
      y: clamp(distances.top / rect.height * 100, 0, 100),
      ...distances,
    };
  };

  const getElementCapability = (e: React.MouseEvent, target: HTMLElement) => {
    const mouseElementPosition = getMousePosition(e, target);
    
    const border = Object.entries({
      n: mouseElementPosition.top <= 5,
      s: mouseElementPosition.bottom <= 5,
      e: mouseElementPosition.right <= 5,
      w: mouseElementPosition.left <= 5,
    }).filter(b => b[1]).map(b => b[0]).join('');

    return border.length ? 'resize-' + border : 'drag';
  };

  interface VisualElement {
    entryId: EntryId;
    entry: Entry;
    target: EventTarget;
    ref: HTMLElement;
    position?: Coordinates;
    size?: Size;
    capability?: string;
    action?: 'drag' | 'resize';
    direction?: string;
    mousePosition?: MousePosition;
  }

  const handleMouseEnter = (e: React.MouseEvent, entryId: EntryId, entry: Entry, ref: HTMLElement): void => {
    const newHighlightedElement: VisualElement = { entryId, entry, target: e.target, ref };
    setHighlightedElement(prevHighlightedElement => {
      if (prevHighlightedElement) {
        if (prevHighlightedElement.action) return prevHighlightedElement;
        else onEntryChange('update', prevHighlightedElement.entryId, { highlighted: false });
      }
      
      onEntryChange('update', entryId, { highlighted: true });
      return newHighlightedElement;
    });
  };

  const handleMouseLeave = () => {
    setHighlightedElement(prevHighlightedElement => {
      if (prevHighlightedElement) {
        if (prevHighlightedElement.action) return prevHighlightedElement;
        else onEntryChange('update', prevHighlightedElement.entryId, { highlighted: false });
      }
      
      return null;
    });
  };

  const handleMouseDown = (e: React.MouseEvent, entryId: EntryId, entry: Entry, ref: HTMLElement) => {
    if (!highlightedElement) return;

    if (e.ctrlKey) {
      // Toggle selection on CTRL+Click
      onEntryChange('update', entryId, { selected: !entry.selected });
      return;
    }

    if (editMode !== 'visual') return;

    onSaveHistory();

    const position: Coordinates = { x: parseFloat(entry.posX), y: parseFloat(entry.posY) };
    const size: Size = { width: parseFloat(entry.width), height: parseFloat(entry.height) };
    const capability = highlightedElement.capability;
    if (!capability) return;
    
    if (capability == 'drag' && !highlightedElement.action) {
      const newAction: Partial<VisualElement> = { action: 'drag', position, size, mousePosition: getMousePosition(e, ref) };
      setHighlightedElement(prevHighlightedElement => prevHighlightedElement ? {...prevHighlightedElement, ...newAction} : null);
    }

    if (capability.startsWith('resize-')) {
      const newAction: Partial<VisualElement> = { action: 'resize', position, size, direction: capability.split('-').pop(), mousePosition: getMousePosition(e, ref) };
      setHighlightedElement(prevHighlightedElement => prevHighlightedElement ? {...prevHighlightedElement, ...newAction} : null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!highlightedElement) return;

    if (!highlightedElement.action) {
      // Update capability if not during an action
      if (!(highlightedElement.target instanceof HTMLElement)) throw new Error('Target is not an HTMLElement');

      const capability = getElementCapability(e, highlightedElement.target);
      setHighlightedElement(prevHighlightedElement => prevHighlightedElement ? {...prevHighlightedElement, capability} : null);
    }
    
    if (highlightedElement.action === 'drag') {
      if (!highlightedElement.mousePosition || !highlightedElement.position) throw new Error('Mouse position or entry position is null');

      // Calculate new position based on mouse movement
      const mousePosition = getMousePosition(e, highlightedElement.ref);
      const diff = { x: mousePosition.x - highlightedElement.mousePosition.x, y: mousePosition.y - highlightedElement.mousePosition.y };
      const newPosition = {
        x: roundToGrid(highlightedElement.position.x + diff.x),
        y: roundToGrid(highlightedElement.position.y + diff.y),
      };

      onEntryChange('update', highlightedElement.entryId, { posX: newPosition.x.toFixed(snapToGrid.decimals), posY: newPosition.y.toFixed(snapToGrid.decimals) });
    }

    if (highlightedElement.action === 'resize') {
      if (!highlightedElement.mousePosition || !highlightedElement.position || !highlightedElement.size) throw new Error('Mouse position or entry position or size is null');

      const mousePosition = getMousePosition(e, highlightedElement.ref);
      const diff = { x: mousePosition.x - highlightedElement.mousePosition.x, y: mousePosition.y - highlightedElement.mousePosition.y };
      const newPosition = {...highlightedElement.position};
      const newSize = {...highlightedElement.size};
      const entryOptions = highlightedElement.entry.options.split(' ');
      const entryCentered = OPTION_CHOICES.centered.find(v => entryOptions.includes(v));
      const centered = (entryCentered === 'centered') || (options.centered && entryCentered !== 'not-centered');
      const resizeMultiplier = centered ? 2 : 1;
      const direction = highlightedElement.direction;
      if (!direction) throw new Error('Direction is null');

      if (direction.includes('n')) {
        newSize.height = roundToGrid(highlightedElement.size.height - diff.y * resizeMultiplier); // Improve roundToGrid
        if (!centered) {
          newPosition.y = roundToGrid(highlightedElement.position.y + Math.min(diff.y, highlightedElement.size.height));
        }
      }
      if (direction.includes('s')) {
        newSize.height = roundToGrid(highlightedElement.size.height + diff.y * resizeMultiplier); // Improve roundToGrid
      }
      if (direction.includes('e')) {
        newSize.width = roundToGrid(highlightedElement.size.width + diff.x * resizeMultiplier); // TODO: Improve roundToGrid
      }
      if (direction.includes('w')) {
        newSize.width = roundToGrid(highlightedElement.size.width - diff.x * resizeMultiplier); // TODO: Improve roundToGrid
        if (!centered) {
          newPosition.x = roundToGrid(highlightedElement.position.x + Math.min(diff.x, highlightedElement.size.width));
        }
      }

      onEntryChange('update', highlightedElement.entryId, {
        posX: newPosition.x.toFixed(snapToGrid.decimals),
        posY: newPosition.y.toFixed(snapToGrid.decimals),
        width: Math.max(0, newSize.width).toFixed(snapToGrid.decimals),
        height: Math.max(0, newSize.height).toFixed(snapToGrid.decimals),
      });
    }
  };

  const handleMouseUp = () => {
    if (!highlightedElement || !highlightedElement.action) return;

    setHighlightedElement(prevHighlightedElement => prevHighlightedElement ? {...prevHighlightedElement, action: undefined, position: undefined, size: undefined} : null);
  };

  const handleSnapToGrid = (value: string) => {
    const gridSize = parseFloat(value);
    const decimals = value.includes('.') ? (value.split('.')[1]||'').length : 0;
    setSnapToGrid({gridSize, decimals});
  };

  const roundToGrid = (value: number) => {
    return Math.round(value/snapToGrid.gridSize)*snapToGrid.gridSize;
  };

  const handleDeselectAll = (e: React.MouseEvent) => {
    if (!(e.target instanceof HTMLElement)) throw new Error('Target is not an HTMLElement');

    // Check if the click is outside of any reveal element
    if (!e.target.closest('.reveal')) {
      forEachEntries(entries, (entry, entryIndex, groupIndex) => {
        if (entry.selected) {
          onEntryChange('update', entryId(groupIndex, entryIndex), { selected: false });
        }
      });
    }
  };

  return (
    <div id="visual-editor" className={['app-panel'].filter(Boolean).join(' ')}>
      <h2>Visual Editor</h2>

      <div className="toolbar">
        <div className="button-group">
          <label className="button"><input type="checkbox" checked={preview} onChange={(e) => { setPreview(e.target.checked); }} /> <span>Preview</span></label>
          <label className="button"><input type="checkbox" checked={revealed} onChange={(e) => { setRevealed(e.target.checked); }} /> <span>Show Answer</span></label>
        </div>
        <div className="button-group">
          <label>
            <span>Sequencing mask:</span>
          </label>
          <select id="ve-mask" value={revealed ? 'default' : sequencingMask} onChange={(e) => { setHighlightSequencing(e.target.value); }} disabled={revealed || preview}>
            <option value="disabled">Disabled</option>
            <option value="default">Normal</option>
            <option value="20">Light</option>
            <option value="88">Strong</option>
            <option value="FF">Full</option>
          </select>
        </div>
        <div className="button-group">
          <label>
            <span>Snap to grid:</span>
          </label>
          <select value={snapToGrid.gridSize} onChange={(e) => { handleSnapToGrid(e.target.value); }} disabled={editMode != 'visual' || preview}>
            <option value="0.01">None</option>
            <option value="0.1">Tiny</option>
            <option value="1">Small</option>
            <option value="5">Large</option>
          </select>
        </div>
      </div>

      <div className="card" style={{padding: 0}}>
        <style>{advancedCSS}</style>
        <style>{revealCSS}</style>

        { !preview && (
          <div
            className={[
              'reveal-container',
              revealed ? 'revealed' : null,
              ...formatOptions(options),
              highlightedElement?.capability ? highlightedElement.capability : null,
            ].filter(Boolean).join(' ')}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleDeselectAll}
          >
            <img className="reveal-background" src={background.data || background.filename} />
            {entries.slice().reverse().map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                {group.slice().reverse().map((entry, entryIndex) => {
                  const id = entryId(entries.length - groupIndex - 1, group.length - entryIndex - 1);
                  return (
                    <div
                      key={entryIndex}
                      className={[
                        'reveal',
                        entry.selected ? 'selected' : null,
                        entry.highlighted ? 'highlighted' : null,
                        ...entry.options.split(' '),
                      ].filter(Boolean).join(' ')}
                      style={{ left: entry.posX+'%', top: entry.posY+'%', width: entry.width+'%', height: entry.height+'%' }}
                      onMouseDown={(e) => { if (e.currentTarget.parentElement) handleMouseDown(e, id, entry, e.currentTarget.parentElement); }}
                      onMouseEnter={(e) => { if (e.currentTarget.parentElement) handleMouseEnter(e, id, entry, e.currentTarget.parentElement); }}
                      onMouseLeave={handleMouseLeave}
                    >
                      <input id={id} type="checkbox" />
                      <SanitizedHtmlElement element={<label htmlFor={id} />} html={entry.label} />
                      <SanitizedHtmlElement element={<div />} html={entry.content} />
                    </div>
                  );
                })}
                {groupIndex < entries.length - 1 && <div className="reveal-sequencing" style={
                  sequencingMask === 'disabled' ? { display: 'none' } : sequencingMask === 'default' ? {} : { backgroundColor: '#00AA00' + sequencingMask }
                }></div>}
              </React.Fragment>
            ))}
          </div>
        )}

        { preview && (
          <>
            <div>
              <div className="header">Deck</div>

              <div className="frame">
                  <div className="front">Front/Title</div>
                  <div className="back">
                    <Preview entries={entries} options={options} backgroundSrc={background.data || background.filename || ''} reveal={revealed} />
                  </div>
                  { revealed && <div className="mnemonic">Mnemonic...</div> }
              </div>

              <div className="source">
                <div className="default"><a href="https://fr.wikipedia.org">Source link</a></div>
                Other source...
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Preview component
 * Renders a preview of the card
 */
function Preview({ entries, options, backgroundSrc, reveal }: {
  entries: Entries;
  options: Options;
  backgroundSrc: string;
  reveal: boolean;
}) {
  return (
    <div className={[ 'reveal-container', reveal ? 'revealed' : null, ...formatOptions(options), ].filter(Boolean).join(' ')}>
      <img className="reveal-background" src={backgroundSrc} />
      {entries.slice().reverse().map((group, groupIndex) => (
        <React.Fragment key={groupIndex}>
          {group.slice().reverse().map((entry, entryIndex) => {
            const id = entryId(entries.length - groupIndex - 1, group.length - entryIndex - 1);
            return (
              <div
                key={entryIndex}
                className={['reveal', ...entry.options.split(' ')].filter(Boolean).join(' ')}
                style={{ left: entry.posX+'%', top: entry.posY+'%', width: entry.width+'%', height: entry.height+'%' }}
              >
                <input id={id} type="checkbox" />
                <SanitizedHtmlElement element={<label htmlFor={id} />} html={entry.label} />
                <SanitizedHtmlElement element={<div />} html={entry.content} />
              </div>
            );
          })}
          {groupIndex < entries.length - 1 && <div className="reveal-sequencing"></div>}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * HtmlEditor component
 * Allows direct editing of the card's HTML
 */
function HtmlEditor({ htmlContent, onHtmlContentChange, importStatus, onEditMode }: {
  htmlContent?: string;
  onHtmlContentChange: (html: string) => void;
  importStatus: ImportStatus;
  onEditMode: (mode: EditMode, save?: boolean) => void;
}) {
  const editMode = React.use(EditMode);

  return (
    <div id="html-editor" className="app-panel">
      <h2>HTML Editor</h2>
      
      <div className="toolbar">
        { editMode === 'html' && (
          <>
            <button type="button" onClick={() => { onEditMode('visual', true); }} disabled={!importStatus.valid}>Save</button>
            <button type="button" onClick={() => { onEditMode('visual', false); }}>Cancel</button>
          </>
        )}
        { editMode === 'visual' && (
          <button type="button" onClick={() => { onEditMode('html'); }}>Edit...</button>
        )}
      </div>

      <div>
        { (importStatus.errors?.length || 0) > 0 && (
          <ul className="import-errors">
            { importStatus.errors?.map(error => <li key={error}>{error}</li>) }
          </ul>
        )}

        { (importStatus.warnings?.length || 0) > 0 && (
          <ul className="import-warnings">
            { importStatus.warnings?.map(warning => <li key={warning}>{warning}</li>) }
          </ul>
        )}
      </div>

      <textarea style={{ width: '100%', height: '400px' }} value={htmlContent} onChange={(e) => { onHtmlContentChange(e.target.value); }} disabled={editMode != 'html'}></textarea>
    </div>
  );
}

/**
 * SettingsModal component
 * Modal for configuring global settings
 */
function SettingsModal({ isOpen, onClose, options, background, onChange, onBackgroundChange, onSaveHistory }: {
  isOpen: boolean;
  onClose: () => void;
  options: Options;
  background: Background;
  onChange: <K extends keyof Options>(action: K, value: Options[K]) => void;
  onBackgroundChange: (data: Background) => void;
  onSaveHistory: () => void;
}): JSX.Element | null {
  if (!isOpen) return null;

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (!(e.target instanceof HTMLElement)) return;
    if (e.target.classList.contains('modal')) {
      onClose();
    }
  };

  return (
    <div className="modal" onClick={handleOutsideClick}>
      <div className="modal-window">
        <button type="button" className="modal-close" onClick={onClose}>❌</button>
        <div className="modal-title">
          <h2>Settings</h2>
        </div>
        <div className="modal-content">
          <Config
            options={options}
            background={background}
            onChange={onChange}
            onBackgroundChange={onBackgroundChange}
            onSaveHistory={onSaveHistory}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Main application component
 * Combines all components and manages state
 */
export default function App(): JSX.Element {
  const initEntries = [
    [
      { selected: false, highlighted: false, label: "LABEL", content: "CONTENT", posX: "50", posY: "50", width: "20", height: "10", options: "" },
    ],
  ];

  const initBackground = { filename: "", data: "" };
  const initHistory = { values: [], index: 0, undo: false, redo: false };

  const [editMode, setEditMode] = React.useState<EditMode>('visual');

  interface ImportStatus {
    errors: string[];
    warnings: string[];
    valid: boolean;
  }
  const initImportStatus: ImportStatus = { errors: [], warnings: [], valid: false };
  const [importStatus, setImportStatus] = React.useState<ImportStatus>(initImportStatus);

  /**
   * Adjusts the coordinate origin of an entry between center and top-left, depending on the value of the invert argument.
   * Parameters:
   *  - entry: The entry objects whose coordinates need to be adjusted.
   *  - invert: A boolean indicating to de-center the coordinates
   * Return:
   *  - Modified object
   */
  const centerEntry = (entry: Entry, invert: boolean): Entry => {
    const factor = invert ? -1 : 1;
    const adjust = (pos: string, size: string) => (parseFloat(pos) + factor * parseFloat(size)/2).toFixed(2).replace(REGEX_TRAILING_ZEROS, '');

    return {
      ...entry,
      posX: adjust(entry.posX, entry.width),
      posY: adjust(entry.posY, entry.height),
    };
  }

  /**
   * Adjusts the coordinate origin of all entries between center and top-left, depending on the value of the invert argument.
   * Note: This apply only to entries not having individual centering option.
   * Parameters:
   *  - entries: An array of entry objects whose coordinates need to be adjusted.
   *  - invert: A boolean indicating to de-center the coordinates
   * Return:
   *  - Modified objects
   */
  const centerEntries = (entries: Entries, invert: boolean): Entries => {
    return mapEntries(entries, (entry) => {
      const optionsList = entry.options.split(' ');
      return (OPTION_CHOICES.centered.some(v => optionsList.includes(v))) ? entry : centerEntry(entry, invert);
    });
  };

  interface State {
    entries: Entries;
    options: Options;
    background: Background;
    history: History;
  }

  interface StateAction {
    type: keyof StateActions;
  }
  interface StateActions {
    reset: StateAction;
    import: StateAction & { entries: Entries; options: Options; background: Background };
    changeOptions: StateAction & { key: keyof Options; value: string | boolean };
    updateBackground: StateAction & { fields: Partial<Background> };
    updateEntry: StateAction & { id: EntryId; fields: Partial<Entry> };
    createEntry: StateAction;
    deleteSelectedEntries: StateAction;
    groupSelectedEntries: StateAction;
    isolateSelectedEntries: StateAction;
    moveSelectedEntries: StateAction & { direction: 'up' | 'down' };
    saveHistory: StateAction;
    undo: StateAction & { clear?: boolean };
    redo: StateAction;
  }

  const stateReducer = (state: State, action: StateActions[keyof StateActions]): State => {
    switch (action.type) {
      case 'reset': {
        setEditMode('visual');
        setImportStatus(initImportStatus);
        return { ...state, entries: defaultEntries, options: defaultOptions, background: defaultBackground, history: initHistory };
      }

      case 'import': {
        const typedAction = action as StateActions['import'];
        const entries = typedAction.entries;
        const options = typedAction.options;
        const background = { ...state.background, ...typedAction.background };
        return { ...state, entries, options, background };
      }

      case 'changeOptions': {
        const typedAction = action as StateActions['changeOptions'];
        const entries = (typedAction.key === 'centered' ? centerEntries(state.entries, !typedAction.value) : state.entries );
        const options = { ...state.options, [typedAction.key]: typedAction.value };
        return { ...state, entries, options };
      }

      case 'updateBackground': {
        const typedAction = action as StateActions['updateBackground'];
        const background = { ...state.background, ...typedAction.fields };
        return { ...state, background };
      }

      case 'updateEntry': {
        const typedAction = action as StateActions['updateEntry'];
        const entries = state.entries.map((group, groupIndex) =>
          group.map((entry, entryIndex) => {
            const id = entryId(groupIndex, entryIndex);
            if (id !== typedAction.id) return entry;

            const newEntry = { ...entry, ...typedAction.fields };

            // Check if ther is any option change (action.fields has an 'options' key) AND this new options is different than entry.options regarding 'centered' and 'not-centered' values.
            const curCentered = OPTION_CHOICES.centered.find(v => entry.options.split(' ').includes(v)) || (state.options.centered ? 'centered' : 'not-centered');
            const newCentered = OPTION_CHOICES.centered.find(v => newEntry.options.split(' ').includes(v)) || (state.options.centered ? 'centered' : 'not-centered');

            if (newCentered === curCentered) return newEntry;

            const adjustedEntry = centerEntry(newEntry, newCentered === 'not-centered');
            return adjustedEntry;
          })
        );
        return { ...state, entries };
      }

      case 'createEntry': {
        const newEntry = defaultEntry(state.options.centered);

        if (state.entries.length === 0) {
          return { ...state, entries: [[newEntry]] };
        }

        return {
          ...state,
          entries: state.entries.map((group, index) => index === state.entries.length - 1 ? [...group, newEntry] : group),
        };
      }

      case 'deleteSelectedEntries': {
        const entries = state.entries.map(group =>
          group.filter(entry => !entry.selected)
        ).filter(group => group.length > 0);

        return { ...state, entries };
      }

      case 'groupSelectedEntries':
      case 'isolateSelectedEntries': {
        const entries: Entries = [];
        let prevSelected: boolean | undefined = undefined;
        let prevGroupId: number | undefined = undefined;

        forEachEntries(state.entries, (entry, _entryId, groupId) => {
          const groupCondition = (action.type === 'groupSelectedEntries') && (entry.selected !== prevSelected || (!entry.selected && groupId !== prevGroupId));
          const isolateCondition = (action.type === 'isolateSelectedEntries') && (entry.selected || prevSelected || groupId !== prevGroupId);
          if (groupCondition || isolateCondition) {
            entries.push([]);
            prevSelected = entry.selected;
            prevGroupId = groupId;
          }
          entries[entries.length - 1].push({...entry});
        });

        return { ...state, entries };
      }

      case 'moveSelectedEntries': {
        const typedAction = action as StateActions['moveSelectedEntries'];
        const dirUp = (typedAction.direction === 'up');
        const entries: Entries = [];
        let preventMoving = false;

        (dirUp ? state.entries : [...state.entries].reverse()).forEach((group, groupId) => {
          const newGroup: EntryGroup = [];

          (dirUp ? group : [...group].reverse()).forEach(entry => {
            if (newGroup.length == 0) {
              // First entry in the group
              if (groupId == 0) {
                // Last group, unable to move down, prevent further moving if selected
                newGroup.push(entry);
                preventMoving = entry.selected;
              } else if(entry.selected && !preventMoving) {
                // Overlap with previous group
                if (dirUp) entries[entries.length-1].push(entry); else entries[0].unshift(entry);
              } else {
                newGroup.push(entry);
              }
            } else if(entry.selected && !preventMoving) {
              // Move entry inside the group
              newGroup.splice(dirUp ? -1 : 1, 0, entry);
            } else {
              // Keep entry in the same position
              if (dirUp) newGroup.push(entry); else newGroup.unshift(entry);
            }
          });

          if (dirUp) entries.push(newGroup); else entries.unshift(newGroup);
        });

        return { ...state, entries: entries.filter(group => group.length > 0) };
      }

      case 'saveHistory': {
        const index = state.history.index;
        const values = state.history.values.slice(0, index);
        values.push({ entries: mapEntries(state.entries, e => ({ ...e, highlighted: false })), options: state.options, background: state.background }); // Don't save highlighted status

        return {
          ...state,
          history: {
            values,
            index: index + 1,
            undo: true,
            redo: false,
          }
        };
      }

      case 'undo': {
        const typedAction = action as StateActions['undo'];
        const prevIndex = state.history.index - 1;
        if (prevIndex < 0) return {...state};

        const values = state.history.values;
        if (values.length <= state.history.index && !typedAction.clear) {
          values.push({ entries: state.entries, options: state.options, background: state.background });
        }

        return {
          ...state,
          ...state.history.values[prevIndex],
          history: { ...state.history, index: prevIndex, undo: prevIndex > 0, redo: !typedAction.clear },
        };
      };

      case 'redo': {
        const nextIndex = state.history.index + 1;
        const lastIndex = state.history.values.length - 1;
        if (nextIndex > lastIndex) return {...state};

        return {
          ...state,
          ...state.history.values[nextIndex],
          history: { ...state.history, index: nextIndex, undo: true, redo: nextIndex < lastIndex },
        };
      };

      default:
        return state;
    }
  };

  // React hooks for managing state and effects
  const [state, dispatch] = React.useReducer(stateReducer, {
    entries: initEntries,
    options: defaultOptions,
    background: initBackground,
    history: initHistory,
  });

  const [htmlContent, setHtmlContent] = React.useState<string>();
  const editingHtmlContent = React.useRef(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const handleOpenSettings = () => { setIsSettingsOpen(true); };
  const handleCloseSettings = () => { setIsSettingsOpen(false); };

  React.useEffect(() => {
    if (editMode != 'visual') return;

    const html = ReactDOMServer.renderToString(<Preview entries={state.entries} options={state.options} backgroundSrc={state.background.filename||''} reveal={false} />);
    setHtmlContent(
      sanitizeHtml(html
        .replace(/(<\w+\s+[^>]*class="([^"]*\s+)?(reveal|reveal-background|reveal-sequencing)(\s+[^"]*)?"[^>]*>)/g, '\n  $1')
        .replace(/<\/div>\s*$/, '\n</div>')
      )
    );
  }, [state, editMode]);

  const handleReset = () => {
    dispatch({ type: 'reset' });
  };

  const handleExport = () => {
      const toaster = document.createElement('div');
      toaster.style.position = 'fixed';
      toaster.style.bottom = '5%';
      toaster.style.left = '5%';
      toaster.style.right = '5%';
      toaster.style.padding = '2%';
      toaster.style.backgroundColor = '#333';
      toaster.style.color = '#fff';
      toaster.style.borderRadius = '10px';
      toaster.style.zIndex = '1000';

      if (!htmlContent) {
        toaster.textContent = '⚠️ No content to copy!';
        document.body.appendChild(toaster);
        setTimeout(() => document.body.removeChild(toaster), 3000);
        return;
      }

      navigator.clipboard.writeText(htmlContent).then(() => {
        toaster.textContent = '✅ Copied to clipboard!';
        document.body.appendChild(toaster);
        setTimeout(() => document.body.removeChild(toaster), 3000);
      }).catch(() => {
        toaster.textContent = '⚠️ Failed to copy!';
        document.body.appendChild(toaster);
        setTimeout(() => document.body.removeChild(toaster), 10000);
      });
  };

  const handleOptionsChange = <K extends keyof Options>(key: K, value: Options[K]) => {
    dispatch({ type: 'changeOptions', key, value });
  };

  const handleBackgroundChange = (fields: Partial<Background>) => {
    dispatch({ type: 'updateBackground', fields });
  };

  const handleEntryChange = <K extends keyof EntryAction>(action: K, ...args: EntryAction[K]) => {
    if (action === 'create') dispatch({ type: 'createEntry' });
    if (action === 'update') dispatch({ type: 'updateEntry', id: args[0], fields: args[1] });
  };

  const handleSelectedEntriesChange = <K extends keyof SelectedEntryAction>(action: K, ...args: SelectedEntryAction[K]) => {
    if (action === 'delete') dispatch({ type: 'deleteSelectedEntries' });
    if (action === 'group') dispatch({ type: 'groupSelectedEntries' });
    if (action === 'isolate') dispatch({ type: 'isolateSelectedEntries' });
    if (action === 'move') dispatch({ type: 'moveSelectedEntries', direction: args[0] });
  };

  const historyHandler = {
    save: () => { dispatch({ type: 'saveHistory' }); },
    undo: () => { dispatch({ type: 'undo' }); },
    redo: () => { dispatch({ type: 'redo' }); },
  };

  /**
   * App shortcuts
   */
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isFormElement = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

      if (!isFormElement) {
        if (e.ctrlKey && e.key === 'z') {
          e.preventDefault();
          dispatch({ type: 'undo' });
        }
        if (e.ctrlKey && e.key === 'y') {
          e.preventDefault();
          dispatch({ type: 'redo' });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const importPercentValue = (value: string) => {
      const match = value.match(/^(\d+(\.\d+)?)%$/);
      return match ? parseFloat(match[1]) : null;
  }

  const handleHtmlContentChange = (html: string) => {
    if (editMode != 'html') return;

    if (!editingHtmlContent.current) {
      dispatch({ type: 'saveHistory' });
      editingHtmlContent.current = true;
    }

    setHtmlContent(html);

    // Parse HTML
    const entries = [];
    const errors = [];
    const warnings = [];
    
    const parser = new DOMParser();
    const document = parser.parseFromString(html, 'text/html');

    const firstElement = document.body.firstElementChild;
    const optionClasses = firstElement?.classList.contains('reveal-container') ? Array.from(firstElement.classList) : [];

    if (optionClasses.length < 1) {
      errors.push('Missing class "reveal-container" on the first element.');
    }

    const optionsList = optionClasses.filter(cls => cls !== 'reveal-container');

    const booleanOption = (opt: string, found: string[]): boolean => {
      if (optionsList.includes(opt)) {
        found.push(opt);
        return true;
      }
      return false;
    }
    const stringOption = (opt: string, found: string[]): string => {
      const values = optionsList.map(cls => {
        if (cls === opt) {
          found.push(cls);
          return '';
        }
        const match = cls.match(/^(.+)-([^-]*)$/);
        return match && match[1] === opt ? match[2] : null;
      }).filter(v => v !== null);

      const validValues = values.filter(v => {
        if (optionValues[opt as keyof typeof optionValues].includes(v)) {
          return true;
        } else {
          warnings.push(`Invalid value "${v}" for option "${opt}", possible values are: ${optionValues[opt as keyof typeof optionValues].join(', ')}`);
          return false;
        }
      });

      if (validValues.length > 1) {
        errors.push(`Multiple values set for option "${opt}"`);
      }

      found.push(...values.map(v => `${opt}-${v}`));
      return (validValues.length > 0) ? validValues[0] : defaultOptions[opt as keyof typeof optionValues];
    };

    const found: string[] = [];
    const options: Options = {
      reversible: booleanOption('reversible', found),
      centered: booleanOption('centered', found),
      hideable: booleanOption('hideable', found),
      front: stringOption('front', found),
      back: stringOption('back', found),
      'front-text': stringOption('front-text', found),
      'back-text': stringOption('back-text', found),
    };

    optionsList.filter(cls => !found.includes(cls)).forEach(cls => {
      warnings.push(`Unknown option "${cls}"`);
    });
    
    const background: Background = {};
    const backgroundElements = document.querySelectorAll('.reveal-background');
    if (backgroundElements.length == 0) {
      errors.push('Missing element with class "reveal-background"');
    } else {
      const src = backgroundElements[0].attributes.getNamedItem('src')?.value || '';

      if (src.length === 0) {
        warnings.push('Background element has empty src property');
      }

      if (src.startsWith('data:')) {
        background.data = src;
      } else {
        background.filename = src;
        if (!state.background.data) warnings.push('Background data can be uploaded from settings dialog')
      }
    }

    if (backgroundElements.length > 1) {
      warnings.push('Too many "reveal-background" elements found, subsequent ones will be discarder');
    }

    const revealElements = document.querySelectorAll('.reveal, .reveal-sequencing');
    let currentGroup: EntryGroup = [];
    revealElements.forEach(element => {
      if (element.classList.contains('reveal-sequencing')) {
        if (currentGroup.length > 0) {
          entries.unshift(currentGroup);
          currentGroup = [];
        }
      } else if (element.classList.contains('reveal')) {
        const inputId = element.querySelector('input')?.attributes.getNamedItem('id')?.value;
        if (!inputId) errors.push(`Invalid element: missing input 'id' attribute`);

        const labelFor = element.querySelector('label')?.attributes.getNamedItem('for')?.value;
        if (!labelFor) errors.push(`Invalid element: missing label 'for' attribute`);
        
        const id = inputId ? inputId : labelFor;
        if (inputId && labelFor && labelFor !== inputId) {
          errors.push(`Invalid element: label 'for' (${labelFor}) and input 'id' (${inputId}) mismatch`);
        }

        const styleLeft = element instanceof HTMLElement ? importPercentValue(element.style.left) : null;
        const styleRight = element instanceof HTMLElement ? importPercentValue(element.style.right) : null;
        const styleWidth = element instanceof HTMLElement ? importPercentValue(element.style.width) : null;
        const horizontalPosition = { posX: 0, width: 0 };
        if ([styleLeft, styleRight, styleWidth].filter(notNullFilter).length >= 2) {
          if (styleLeft !== null && styleWidth !== null) {
            horizontalPosition.posX = styleLeft;
            horizontalPosition.width = styleWidth;
            if (styleRight !== null) warnings.push(`Element [${id ?? ''}]: ignoring 'right' property`);
          } else if (styleRight !== null && styleWidth !== null) {
            horizontalPosition.posX = 100 - styleRight - styleWidth;
            horizontalPosition.width = styleWidth;
            warnings.push(`Element [${id ?? ''}]: changing 'right' property to 'left' based on 'width'`);
          } else if (styleLeft !== null && styleRight !== null) {
            horizontalPosition.posX = styleLeft;
            horizontalPosition.width = 100 - styleLeft - styleRight;
            warnings.push(`Element [${id ?? ''}]: changing 'right' property to 'width' based on 'left'`);
          }
        } else {
          errors.push(`Invalid element [${id ?? ''}]: insufficient or invalid values for 'left', 'right', or 'width' properties`);
        }

        const styleTop = element instanceof HTMLElement ? importPercentValue(element.style.top) : null;
        const styleBottom = element instanceof HTMLElement ? importPercentValue(element.style.bottom) : null;
        const styleHeight = element instanceof HTMLElement ? importPercentValue(element.style.height) : null;
        const verticalPosition = { posY: 0, height: 0 };
        if ([styleTop, styleBottom, styleHeight].filter(notNullFilter).length >= 2) {
          if (styleTop !== null && styleHeight !== null) {
            verticalPosition.posY = styleTop;
            verticalPosition.height = styleHeight;
            if (styleBottom !== null) warnings.push(`Element [${id ?? ''}]: ignoring 'bottom' property`);
          } else if (styleBottom !== null && styleHeight !== null) {
            verticalPosition.posY = 100 - styleBottom - styleHeight;
            verticalPosition.height = styleHeight;
            warnings.push(`Element [${id ?? ''}]: changing 'bottom' property to 'top' based on 'height'`);
          } else if (styleTop !== null && styleBottom !== null) {
            verticalPosition.posY = styleTop;
            verticalPosition.height = 100 - styleTop - styleBottom;
            warnings.push(`Element [${id ?? ''}]: changing 'bottom' property to 'height' based on 'top'`);
          }
        } else {
          errors.push(`Invalid element [${id ?? ''}]: insufficient or invalid values for 'left', 'right', or 'width' properties`);
        }

        const entry: Entry = {
          selected: false,
          highlighted: false,
          label: element.querySelector('label')?.innerHTML ?? '',
          content: element.querySelector('div')?.innerHTML ?? '',
          posX: horizontalPosition.posX.toFixed(),
          posY: verticalPosition.posY.toFixed(),
          width: horizontalPosition.width.toFixed(),
          height: verticalPosition.height.toFixed(),
          options: Array.from(element.classList).filter(cls => cls !== 'reveal').join(' '),
        };

        currentGroup.unshift(entry);
      }
    });

    if (currentGroup.length > 0) {
      entries.unshift(currentGroup);
    }

    dispatch({ type: 'import', entries, options, background});
    setImportStatus({ errors, warnings, valid: errors.length === 0 });
  };

  const handleEditMode = (mode: EditMode, acceptImport?: boolean) => {
    switch (mode) {
      case 'html':
        setEditMode('html');
        editingHtmlContent.current = false;
        return;

      case 'visual':
        if (editingHtmlContent.current && !acceptImport) {
          dispatch({ type: 'undo', clear: true });
        }
        setEditMode('visual');
        editingHtmlContent.current = false;
        setImportStatus(initImportStatus);
        return;
    }
  };

  return (
    <main>
      <EditMode value={editMode}>
        <div className="app-navbar">
          <h1 className="app-header">{APP_TITLE} <span className="app-version">v{APP_VERSION}</span></h1>
          <Toolbar onReset={handleReset} onExport={handleExport} history={state.history} onUndo={historyHandler.undo} onRedo={historyHandler.redo} onOpenSettings={handleOpenSettings} />
        </div>
        
        <TableEditor entries={state.entries} onChange={handleEntryChange} onChangeSelected={handleSelectedEntriesChange} onSaveHistory={historyHandler.save} />
        <VisualEditor entries={state.entries} options={state.options} background={state.background} onEntryChange={handleEntryChange} onSaveHistory={historyHandler.save} />
        <HtmlEditor htmlContent={htmlContent} importStatus={importStatus} onEditMode={handleEditMode} onHtmlContentChange={handleHtmlContentChange} />
        <SettingsModal isOpen={isSettingsOpen} onClose={handleCloseSettings} options={state.options} background={state.background} onChange={handleOptionsChange} onBackgroundChange={handleBackgroundChange} onSaveHistory={historyHandler.save} />
      </EditMode>
    </main>
  );
}
