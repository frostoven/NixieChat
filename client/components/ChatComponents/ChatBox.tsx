import React from 'react';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { ChatBoxButton } from './ChatBoxButton';
import { AutoKeyMap } from '../../events/AutoKeyMap';
import {
  EncryptedAccountStorage,
} from '../../storage/EncryptedAccountStorage';
import { EmoticonWindow } from './EmoticonWindow';

const accountStorage = new EncryptedAccountStorage();

// TODO: Move text box themes to a central point.
const darkTheme: React.CSSProperties = {
  color: '#c2c2c2',
  backgroundColor: '#424242',
};

const lightTheme: React.CSSProperties = {
  color: '#a2a2a2',
  backgroundColor: '#fdfdfd',
};

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  background: '#fdfdfd',
  bottom: 0,
  left: 0,
  right: 0,
};

const containerStyleDark = {
  ...containerStyle,
  ...darkTheme,
};

const containerStyleLight = {
  ...containerStyle,
  ...lightTheme,
};

const innerStyle: React.CSSProperties = {
  marginRight: 15,
};

const buttonStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#525252',
};

const textBoxStyle: React.CSSProperties = {
  textAlign: 'left',
  width: '100%',
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
  accountName: string,
  messageDetachableId: string,
  onSendMessage: Function,
  onCloseChat: Function,
}

// Important note: Do not use React state to manage large text entry - it's
// incredibly slow, visibly so on cheaper devices. Instead, we let the browser
// manage text state, and then we read its values via ref when needed.
class ChatBox extends React.Component<Props> {
  private readonly textBoxRef: React.RefObject<any>;
  private autoKeyMap = new AutoKeyMap();
  private draftTimer: number = 0;

  state = {
    showEmoticonWindow: false,
  };

  constructor(props: Props | Readonly<Props>) {
    super(props);
    this.textBoxRef = React.createRef();
  }

  componentDidMount() {
    // Set up keybindings.
    this.autoKeyMap.bindKeys({
      Enter: this.sendMessage,
      NumpadEnter: this.sendMessage,
      Escape: this.onBack,
    });

    const textArea: HTMLTextAreaElement = this.textBoxRef.current;
    if (textArea) {
      this.loadDraft(textArea);
      textArea.onblur = () => this.saveDraft(textArea);
      // @ts-ignore - Whoever wrote that type entry is a moron.
      // https://developer.mozilla.org/en-US/docs/Web/API/setInterval#return_value
      this.draftTimer = setInterval(() => this.saveDraft(textArea), 60000);
    }

    // Save drafts when the tab / application exits.
    window.addEventListener('beforeunload', this.saveOnExit);
  }

  componentWillUnmount() {
    // Store draft of the current text so the user does not lose it.
    const textArea: HTMLTextAreaElement = this.textBoxRef.current;
    if (textArea) {
      this.saveDraft(textArea);
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

  onBack = () => {
    if (this.state.showEmoticonWindow) {
      this.setState({
        showEmoticonWindow: false,
      }, () => {
        if (this.textBoxRef.current) {
          this.textBoxRef.current.focus();
        }
      })
    }
    else {
      this.props.onCloseChat();
    }
  };

  saveOnExit = () => {
    // Store draft of the current text so the user does not lose it.
    const textArea: HTMLTextAreaElement = this.textBoxRef.current;
    if (textArea) {
      this.saveDraft(textArea);
    }
  };

  // Saves the current unsent message for later use.
  saveDraft = (textArea: HTMLTextAreaElement) => {
    const { accountName, messageDetachableId } = this.props;
    const message = textArea.value;
    if (message) {
      accountStorage.saveDraft({
        accountName,
        messageDetachableId,
        message,
      }).catch(console.error);
    }
    else {
      accountStorage.deleteDraft({
        accountName,
        messageDetachableId,
      }).catch(console.error);
    }
  };

  // Restores the last unsent message.
  loadDraft = (textArea: HTMLTextAreaElement) => {
    const { accountName, messageDetachableId } = this.props;
    accountStorage.loadDraft({
      accountName,
      messageDetachableId,
    }).then((message) => {
      if (message) {
        textArea.value = message;
        this.recalculateSize();
      }
    }).catch(console.error);
  };

  sendMessage = () => {
    const textArea: HTMLTextAreaElement = this.textBoxRef.current;
    if (!textArea) {
      return;
    }

    if (AutoKeyMap.isShiftDown) {
      // Add a line break instead.
      textArea.value += '\r\n';
    }
    else {
      let result = textArea.value.trim();
      if (!result) {
        return;
      }
      this.props.onSendMessage(textArea.value);
      textArea.value = '';
    }

    this.recalculateSize();
  };

  recalculateSize = () => {
    const textArea: HTMLTextAreaElement = this.textBoxRef.current;
    if (textArea) {
      // We first set auto and then actual height. Auto forces an element
      // shrink while the px height forces growth.
      textArea.style.height = 'auto';
      textArea.style.height = textArea.scrollHeight + 'px';
    }
  };

  toggleEmoticonWindow = () => {
    this.setState({
      showEmoticonWindow: !this.state.showEmoticonWindow,
    });
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const themeStyle = darkMode ? containerStyleDark : containerStyleLight;
    const textBoxTheme = darkMode ? textBoxStyleDark : textBoxStyleLight;
    const { showEmoticonWindow } = this.state;
    return (
      <div style={themeStyle}>
        {showEmoticonWindow ? <EmoticonWindow/> : null}
        <div className="chat-box" style={innerStyle}>
          <div
            className="chat-box-column"
            style={buttonStyle}
            onClick={this.toggleEmoticonWindow}
          >
            <ChatBoxButton
              icon="smile outline"
            />
          </div>
          <div className="chat-box-column" style={buttonStyle}>
            <textarea
              ref={this.textBoxRef}
              autoFocus style={textBoxTheme}
              onChange={this.recalculateSize}
              placeholder=" Message area..."
            />
          </div>
          <div className="chat-box-column" style={buttonStyle}>
            <ChatBoxButton
              icon="attach"
            />
          </div>
          <div className="chat-box-column" style={buttonStyle}>
            <ChatBoxButton
              icon="microphone"
            />
          </div>
        </div>
      </div>
    );
  }
}

export {
  ChatBox,
};
