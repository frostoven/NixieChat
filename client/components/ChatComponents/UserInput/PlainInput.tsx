import React from 'react';
import { AutoKeyMap } from '../../../frostLib/AutoKeyMap';
import { DraftIo } from './DraftIo';
import {
  UnencryptedSettings,
} from '../../../storage/cacheFrontends/UnencryptedSettings';

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
  width: '97%',
  // This is the starting value only. This is auto-calculated as the user
  // enters text.
  height: 'auto',
  maxHeight: 199,
  border: 'none',
  outline: 'none',
  fontSize: '11pt',
  lineHeight: '12pt',
  resize: 'none',
  padding: 0,
  marginLeft: 11,
  verticalAlign: 'bottom',
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
  accountName: string,
  messageDetachableId: string,
  onSendMessage: Function,
  getSendTrigger: Function,
  onBack: Function,
}

/**
 * This is the fallback text input. It does not support emoticons. Its intended
 * use is slow and old devices.
 *
 * Important note: Do not use React state to manage large text entry - it's
 * incredibly slow, visibly so on cheaper devices. Instead, we let the browser
 * manage text state, and then we read its values via ref when needed.
 */
class PlainInput extends React.Component<Props> {
  private autoKeyMap = new AutoKeyMap();
  private draftTimer: NodeJS.Timer | number = 0;

  draft = new DraftIo(this.props.accountName, this.props.messageDetachableId);

  constructor(props: Props | Readonly<Props>) {
    super(props);
    // Allow the parent to trigger a message send via external means.
    props.getSendTrigger(this.sendMessage);
  }

  componentDidMount() {
    // Set up keybindings.
    this.autoKeyMap.bindKeys({
      Enter: this.sendMessage,
      NumpadEnter: this.sendMessage,
      Escape: this.props.onBack,
    });

    const textArea: HTMLTextAreaElement = this.props.textBoxRef.current;
    if (textArea) {
      this.draft.loadDraft((value: string) => {
        textArea.value = value;
      }, true);
      textArea.onblur = () => this.draft.saveDraft(textArea);
      this.draftTimer = setInterval(() => this.draft.saveDraft(textArea), 60000);
    }

    // Save drafts when the tab / application exits.
    window.addEventListener('beforeunload', this.saveOnExit);

    // Allow the parent to trigger a message send via external means.
    this.props.getSendTrigger(() => this.sendMessage);

    setTimeout(() => {
      // For some reason Chrome doesn't update properly unless we wait a bit.
      // Note that this recalc isn't critical; typing some text will auto-fix
      // this problem anyway, it's more for visual pretties / consistency.
      this.recalculateSize();
    }, 100);
  }

  componentWillUnmount() {
    // Store draft of the current text so the user does not lose it.
    const textArea: HTMLTextAreaElement = this.props.textBoxRef.current;
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

  saveOnExit = () => {
    // Store draft of the current text so the user does not lose it.
    const textArea: HTMLTextAreaElement = this.props.textBoxRef.current;
    if (textArea) {
      this.draft.saveDraft(textArea);
    }
  };

  sendMessage = (_: Event, allowBubbling: () => void) => {
    const textArea: HTMLTextAreaElement = this.props.textBoxRef.current;
    if (!textArea) {
      return;
    }

    console.log('AutoKeyMap.isShiftDown?', AutoKeyMap.isShiftDown);

    if (AutoKeyMap.isShiftDown) {
      // Allow the browser to insert a line break here.
      allowBubbling();
    }
    else {
      let result = textArea.value.trim();
      if (!result) {
        return;
      }
      this.props.onSendMessage(textArea);
      textArea.value = '';
    }

    this.recalculateSize();
  };

  recalculateSize = () => {
    const textArea: HTMLTextAreaElement = this.props.textBoxRef.current;
    if (textArea) {
      // We first set auto and then actual height. Auto forces an element
      // shrink while the px height forces growth.
      textArea.style.height = 'auto';
      textArea.style.height = textArea.scrollHeight + 'px';
    }
  };

  render() {
    const darkMode = UnencryptedSettings.isDarkModeEnabled();
    const textBoxTheme = darkMode ? textBoxStyleDark : textBoxStyleLight;
    // const themeStyle = darkMode ? containerStyleDark : containerStyleLight;

    return (
      <textarea
        className="plain-editable"
        ref={this.props.textBoxRef}
        autoFocus
        style={textBoxTheme}
        onChange={this.recalculateSize}
        placeholder=" Message area..."
      />
    );
  }
}

export {
  PlainInput,
};
