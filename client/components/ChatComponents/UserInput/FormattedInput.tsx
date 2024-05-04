import React from 'react';
import { AutoKeyMap } from '../../../events/AutoKeyMap';
import { DraftIo } from './DraftIo';
import { Settings } from '../../../storage/cacheFrontends/Settings';
import { CaretControl } from '../../../richInput/CaretControl';

// TODO: Move text box themes to a central point.
const darkTheme: React.CSSProperties = {
  color: '#c2c2c2',
  backgroundColor: '#424242',
};

const lightTheme: React.CSSProperties = {
  color: '#a2a2a2',
  backgroundColor: '#fdfdfd',
};

const textBoxStyle: React.CSSProperties = {
  textAlign: 'left',
  width: '100%',
  // This is the starting value only. This is auto-calculated as the user
  // enters text.
  height: 'auto',
  maxHeight: 199,
  border: 'none',
  borderRadius: 'none',
  paddingBottom: 10,
  overflowY: 'auto',
  whiteSpace: 'pre-wrap',
  // TODO: Consider giving the user the option to switch this to
  //  `overflow-wrap: normal`, maybe call the option "scroll on very long
  //  lines" or something. While most lines will still break, this option
  //  allows really long lines to scroll horizontally while still breaking
  //  everything else. `anywhere` aligns more with other chat apps.
  overflowWrap: 'anywhere',
};

const textBoxStyleDark: React.CSSProperties = {
  ...textBoxStyle,
  ...darkTheme,
  color: '#fff',
};

const textBoxStyleLight: React.CSSProperties = {
  ...textBoxStyle,
  ...lightTheme,
  color: '#000',
};

interface Props {
  textBoxRef: React.RefObject<any>,
  caretControl: CaretControl,
  accountName: string,
  messageDetachableId: string,
  onSendMessage: Function,
  onBack: Function,
}

/**
 * This is the advanced text input. It uses HTML to allow formatted text.
 *
 * Important note: Do not use React state to manage large text entry - it's
 * incredibly slow, visibly so on cheaper devices. Instead, we let the browser
 * manage text state, and then we read its values via ref when needed.
 */
class FormattedInput extends React.Component<Props> {
  private autoKeyMap = new AutoKeyMap();
  private draftTimer: NodeJS.Timer | number = 0;

  draft = new DraftIo(this.props.accountName, this.props.messageDetachableId);

  componentDidMount() {
    // Update caret control instance.
    if (this.props.textBoxRef.current) {
      this.props.caretControl.setParent(this.props.textBoxRef.current);
    }

    // Set up keybindings.
    this.autoKeyMap.bindKeys({
      Enter: this.sendMessage,
      NumpadEnter: this.sendMessage,
      Escape: this.props.onBack,
      // Disallow the user accidentally destroying trailing breaks.
      Backspace: (_: any, allowBubbling: Function) => {
        allowBubbling();
        this.recalculateSize();
      },
      Delete: (_: any, allowBubbling: Function) => {
        allowBubbling();
        this.recalculateSize();
      },
    });

    const textArea: HTMLDivElement = this.props.textBoxRef.current;
    if (textArea) {
      this.draft.loadDraft((value: string) => {
        textArea.textContent = value;
      });
      textArea.onblur = () => this.draft.saveDraft(textArea.textContent);
      this.draftTimer = setInterval(() => this.draft.saveDraft(textArea), 60000);

      // Manually autofocus. Needed for contentEditable, which does not support
      // autofocus.
      textArea.focus();
    }

    // Save drafts when the tab / application exits.
    window.addEventListener('beforeunload', this.saveOnExit);
  }

  componentWillUnmount() {
    // Store draft of the current text so the user does not lose it.
    const textArea: HTMLDivElement = this.props.textBoxRef.current;
    if (textArea) {
      this.draft.saveDraft(textArea.textContent);
    }

    // Unbind hotkeys.
    this.autoKeyMap.destroy();

    // Clear the 20-second timer if it exists.
    if (this.draftTimer) {
      clearInterval(this.draftTimer);
    }

    // Stop listening for application exist when the component unmounts.
    window.removeEventListener('beforeunload', this.saveOnExit);
  }

  saveOnExit = () => {
    // Store draft of the current text so the user does not lose it.
    const textArea: HTMLDivElement = this.props.textBoxRef.current;
    if (textArea) {
      this.draft.saveDraft(textArea.textContent);
    }
  };

  sendMessage = () => {
    const textArea: HTMLDivElement = this.props.textBoxRef.current;
    if (!textArea) {
      return;
    }

    console.log('AutoKeyMap.isShiftDown?', AutoKeyMap.isShiftDown);

    if (AutoKeyMap.isShiftDown) {
      console.log('=> FormattedInput 239');
      this.props.caretControl.insertElementAtCaret(document.createElement('br'));
      // Sometimes we get cucked and apparently nothing happens. Force.
      this.appendLineBreakIfNeeded();
    }
    else {
      let result = textArea.textContent!.trim();
      if (!result) {
        return;
      }
      this.props.onSendMessage(textArea.textContent);
      textArea.textContent = '';
    }

    this.recalculateSize();
  };

  recalculateSize = () => {
    const textArea: HTMLDivElement = this.props.textBoxRef.current;
    if (textArea) {
      // We first set auto and then actual height. Auto forces an element
      // shrink while the px height forces growth.
      textArea.style.height = 'auto';
      textArea.style.height = (textArea.scrollHeight + 2) + 'px';
    }
  };

  // Things don't work well if we don't have line breaks at the end. This
  // function adds line breaks at the end if they don't exist.
  //
  // Please don't call this during normal typing operations as it can mess up
  // the cursor position and cause other issues. This is currently intended
  // for situations where the user intentionally adds line breaks.
  appendLineBreakIfNeeded = () => {
    const textArea: HTMLDivElement = this.props.textBoxRef.current;
    if (textArea) {
      const innerText = textArea.innerText;
      const len = innerText.length;

      if (innerText[len - 1] !== '\n') {
        textArea.append(document.createElement('br'));
      }

      if (innerText[len - 2] !== '\n') {
        textArea.append(document.createElement('br'));
      }
    }
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const textBoxTheme = darkMode ? textBoxStyleDark : textBoxStyleLight;
    // const themeStyle = darkMode ? containerStyleDark : containerStyleLight;

    return (
      <div
        className="advanced-editable"
        ref={this.props.textBoxRef}
        contentEditable
        style={textBoxTheme}
        onInput={this.recalculateSize}
        placeholder=" Message area..."
      />
    );
  }
}

export {
  FormattedInput,
};
