import React from 'react';
import { AutoKeyMap } from '../../../frostLib/AutoKeyMap';
import { DraftIo } from './DraftIo';
import {
  UnencryptedSettings,
} from '../../../storage/cacheFrontends/UnencryptedSettings';
import { CaretControl } from '../../../frostLib/richInput/CaretControl';

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
  getSendTrigger: Function,
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

  constructor(props: Props | Readonly<Props>) {
    super(props);
    // Allow the parent to trigger a message send via external means.
    props.getSendTrigger(this.sendMessage);
  }

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
      this.draft.loadDraft((nodes: Node[]) => {
        textArea.textContent = '';
        textArea.append(...nodes);
      });
      textArea.addEventListener('blur', () => {
        this.draft.saveDraft(textArea);
      });
      this.draftTimer = setInterval(() => this.draft.saveDraft(textArea), 60000);

      // Manually autofocus. Needed for contentEditable, which does not support
      // autofocus.
      textArea.focus();

      // Removes unrecognized formatting from the specified content-editable.
      textArea.addEventListener('paste', this.handlePaste);
    }

    // Save drafts when the tab / application exits.
    window.addEventListener('beforeunload', this.saveOnExit);

    setTimeout(() => {
      // For some reason Chrome doesn't update properly unless we wait a bit.
      // Note that this recalc isn't critical; typing some text will auto-fix
      // this problem anyway, it's more for visual pretties / consistency.
      this.recalculateSize();
    }, 100);
  }

  componentWillUnmount() {
    // Store draft of the current text so the user does not lose it.
    const textArea: HTMLDivElement = this.props.textBoxRef.current;
    if (textArea) {
      this.draft.saveDraft(textArea);
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

  public shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
    // Unless the textBoxRef has changed, there's no reason to update this
    // component.
    return this.props.textBoxRef !== nextProps.textBoxRef;
  }

  saveOnExit = () => {
    // Store draft of the current text so the user does not lose it.
    const textArea: HTMLDivElement = this.props.textBoxRef.current;
    if (textArea) {
      this.draft.saveDraft(textArea);
    }
  };

  // Due to the fact that Firefox does not support plaintext-only
  // content-editable fields, we need to manually strip out garbage that
  // comes randomly pasted sources.
  // TODO: Correctly deal with emoticon metadata.
  handlePaste = (event: ClipboardEvent) => {
    console.log('--> pasting');
    const textArea: HTMLDivElement = this.props.textBoxRef.current;
    if (!textArea) {
      // Return before doing preventDefault() so that users would hopefully
      // still have some pasting functionality if we ever introduced bugs.
      return;
    }

    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    this.props.caretControl.insertNodeAtCaret(document.createTextNode(text));
    this.recalculateSize();
  };

  sendMessage = () => {
    const textArea: HTMLDivElement = this.props.textBoxRef.current;
    if (!textArea) {
      return;
    }

    if (AutoKeyMap.isShiftDown) {
      this.props.caretControl.insertNodeAtCaret(document.createElement('br'));
      // Sometimes we get cucked and apparently nothing happens. Force.
      this.appendLineBreakIfNeeded();
    }
    else {
      // We cannot see image-based emoticons with text accessors such as
      // textContent et al. In order to ensure the field contains valid data we
      // therefore also find the first (if any) as part of the check.
      let result =
        textArea.textContent!.trim() +
        (textArea.querySelector('img')?.alt || '');
      if (!result) {
        return;
      }
      this.props.onSendMessage(textArea);
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
    const darkMode = UnencryptedSettings.isDarkModeEnabled();
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
