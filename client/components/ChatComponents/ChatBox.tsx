import React from 'react';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { ChatBoxButton } from './ChatBoxButton';
import { AutoKeyMap } from '../../events/AutoKeyMap';

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
  messageDetachableId: string,
  onCloseChat: Function,
}

// Important note: Do not use React state to manage large text entry - it's
// incredibly slow, visibly so on cheaper devices. Instead, we let the browser
// manage text state, and then we read its values via ref when needed.
class ChatBox extends React.Component<Props> {
  static draft = {};

  private readonly textBoxRef: React.RefObject<any>;
  private autoKeyMap = new AutoKeyMap();

  constructor(props: Props | Readonly<Props>) {
    super(props);
    this.textBoxRef = React.createRef();
  }

  componentDidMount() {
    // Set up keybindings.
    this.autoKeyMap.bindKeys({
      Enter: this.sendMessage,
      NumpadEnter: this.sendMessage,
      Escape: this.props.onCloseChat,
    });

    const textArea: HTMLTextAreaElement = this.textBoxRef.current;
    const messageDetachableId = this.props.messageDetachableId;
    if (textArea && ChatBox.draft[messageDetachableId]) {
      // Restore drafts if this chat had any stored.
      textArea.value = ChatBox.draft[messageDetachableId];
      this.recalculateSize();
    }
  }

  componentWillUnmount() {
    // Store draft of the current text so the user does not lose it.
    const textArea: HTMLTextAreaElement = this.textBoxRef.current;
    if (textArea) {
      ChatBox.draft[this.props.messageDetachableId] = textArea.value;
    }

    // Unbind hotkeys.
    this.autoKeyMap.destroy();
  }

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
      console.log('> Send:', textArea.value);
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

  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const themeStyle = darkMode ? containerStyleDark : containerStyleLight;
    const textBoxTheme = darkMode ? textBoxStyleDark : textBoxStyleLight;
    return (
      <div style={themeStyle}>
        <div className="chat-box" style={innerStyle}>
          <div className="chat-box-column" style={buttonStyle}>
            <ChatBoxButton
              icon="attach"
            />
          </div>
          <div className="chat-box-column" style={buttonStyle}>
            <textarea
              ref={this.textBoxRef}
              autoFocus style={textBoxTheme}
              onChange={this.recalculateSize}
            />
          </div>
          <div className="chat-box-column" style={buttonStyle}>
            <ChatBoxButton
              icon="smile outline"
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
