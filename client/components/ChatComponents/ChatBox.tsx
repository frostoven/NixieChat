import React from 'react';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { ChatBoxButton } from './ChatBoxButton';

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
  height: 44,
  border: 'none',
  outline: 'none',
  fontSize: '10pt',
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

class ChatBox extends React.Component {
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
            <input autoFocus style={textBoxTheme}/>
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
