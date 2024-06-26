import React from 'react';
import {
  UnencryptedSettings,
} from '../../storage/cacheFrontends/UnencryptedSettings';
import { ChatBoxButton } from './ChatBoxButton';
import { EmoticonWindow } from './EmoticonWindow';
import { StyleManifest } from '../../emoticonConfig/types/StyleManifest';
import { PlainInput } from './UserInput/PlainInput';
import { FormattedInput } from './UserInput/FormattedInput';
import { CaretControl } from '../../frostLib/richInput/CaretControl';
import { generateEmoticon } from '../../frostLib/richInput/generateEmoticon';
import { microRouter } from '../../frostLib/microRouter';

const ICON_PATH = 'assets/icons';

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
  private caretControl = new CaretControl();
  // Hints that the text may contain emoticons or other formatted text. The
  // reason we indicate this is so that the recipient doesn't waste CPU
  // manually parsing a message when all we have is a bunch of plaintext.
  private possiblyHasFormatting = false;
  // This is overwritten by getSendTrigger in the render function.
  private requestInputMessageSend: Function = () => {
  };

  state = {
    showEmoticonWindow: false,
  };

  constructor(props: Props | Readonly<Props>) {
    super(props);
    this.textBoxRef = React.createRef();
  }

  onBack = () => {
    if (this.state.showEmoticonWindow) {
      this.setState({
        showEmoticonWindow: false,
      }, () => {
        microRouter.back();
        if (this.textBoxRef.current) {
          this.textBoxRef.current.focus();
        }
      });
    }
    else {
      this.props.onCloseChat();
    }
  };

  toggleEmoticonWindow = () => {
    this.setState({
      showEmoticonWindow: !this.state.showEmoticonWindow,
    }, () => {
      if (this.state.showEmoticonWindow) {
        microRouter.changeRoute({
          to: 'options',
          nav: { back: 'chat' },
          onBackTriggered: () => this.onBack(),
        });
      }
      else {
        microRouter.back();
      }
    });
  };

  onInsertEmoticon = (
    unicode: number, styleManifest: StyleManifest, path: string, tone: number,
  ) => {
    const richInputEnabled = UnencryptedSettings.richInputEnabled();
    if (!richInputEnabled) {
      // Note: We can *partially* support this (but cannot mix packs / tones in
      // one message). Whether we should spend the time is still to be decided.
      console.warn('Cannot currently use emoticons in textareas.');
      return;
    }

    this.possiblyHasFormatting = true;
    if (this.textBoxRef.current) {
      const emo = generateEmoticon(
        unicode,
        path,
        styleManifest,
        tone,
      );
      this.caretControl.insertNodeAtCaret(emo);
    }
    else {
      console.error('ref not ready');
    }
  };

  onSendMessage = (element: HTMLDivElement | HTMLTextAreaElement) => {
    this.props.onSendMessage(element, this.possiblyHasFormatting);
    this.possiblyHasFormatting = false;
  };

  // Allows us to force the input component to trigger a message send via
  // external means (such as an unrelated button component).
  saveSendTrigger = (callback: Function) => {
    this.requestInputMessageSend = callback;
  };

  render() {
    const darkMode = UnencryptedSettings.isDarkModeEnabled();
    const richInputEnabled = UnencryptedSettings.richInputEnabled();
    const themeStyle = darkMode ? containerStyleDark : containerStyleLight;

    let InputComponent = richInputEnabled ? FormattedInput : PlainInput;

    const { showEmoticonWindow } = this.state;
    return (
      <div style={themeStyle}>
        {
          showEmoticonWindow ?
            <EmoticonWindow
              onInsertEmoticon={this.onInsertEmoticon}
              onRefreshNeeded={() => this.forceUpdate()}
            /> :
            null
        }
        <div className="chat-box" style={innerStyle}>
          <div
            className="chat-box-column"
            style={buttonStyle}
            onClick={this.toggleEmoticonWindow}
          >
            <ChatBoxButton
              fileName={`${ICON_PATH}/smile.webp`}
            />
          </div>
          <div className="chat-box-column" style={buttonStyle}>
            <InputComponent
              textBoxRef={this.textBoxRef}
              caretControl={this.caretControl}
              accountName={this.props.accountName}
              messageDetachableId={this.props.messageDetachableId}
              onSendMessage={this.onSendMessage}
              getSendTrigger={this.saveSendTrigger}
              onBack={this.onBack}
            />
          </div>
          <div className="chat-box-column" style={buttonStyle}>
            <ChatBoxButton
              fileName={`${ICON_PATH}/clip.webp`}
            />
          </div>
          <div className="chat-box-column" style={buttonStyle}>
            <ChatBoxButton
              fileName={`${ICON_PATH}/send.webp`}
              onClick={() => this.requestInputMessageSend()}
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
