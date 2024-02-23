import React from 'react';
import { Message } from '../../storage/EncryptedChat/Message';
import {
  EncryptedAccountStorage,
} from '../../storage/EncryptedAccountStorage';
import { Settings } from '../../storage/cacheFrontends/Settings';

const accountStorage = new EncryptedAccountStorage();

const containerStyle: React.CSSProperties = {
  width: '100%',
};

const bubbleStyle: React.CSSProperties = {
  borderRadius: 14,
  padding: '7px 11px',
  margin: 8,
  fontSize: '10pt',
  width: 'fit-content',
  maxWidth: 420,
  // Makes non-br line breaks render as br.
  whiteSpace: 'pre-line',
};

const outboundFloatStyle: React.CSSProperties = {
  marginLeft: 'auto',
};

const inboundFloatStyle: React.CSSProperties = {
  marginRight: 'auto',
};

const devMessageCountStyle: React.CSSProperties = {
  position: 'absolute',
  marginLeft: -20,
  fontWeight: 'bold',
};

// Stores all styles in a hierarchy.
const styleDirectionIsOutbound = new Map();

// Outbound style (messages we send).
styleDirectionIsOutbound.set(true, {
  darkMode: {
    ...bubbleStyle,
    ...outboundFloatStyle,
    color: '#f6f6f6',
    backgroundColor: '#224c72',
  },
  lightMode: {
    ...bubbleStyle,
    ...outboundFloatStyle,
    color: '#000000',
    backgroundColor: '#f8fde1',
  },
});

// Inbound style (messages we receive).
styleDirectionIsOutbound.set(false, {
  darkMode: {
    ...bubbleStyle,
    ...inboundFloatStyle,
    color: '#f6f6f6',
    backgroundColor: '#1f263e',
  },
  lightMode: {
    ...bubbleStyle,
    ...inboundFloatStyle,
    color: '#000000',
    backgroundColor: '#fcfcfc',
  },
});

interface Props {
  bubbleId: number,
  message: Message,
}

class ChatBubble extends React.Component<Props> {
  shouldComponentUpdate(): boolean {
    // TODO: Change this to check for message edits.
    return false;
  }

  render() {
    console.log('Rendering bubble', this.props.bubbleId);
    const { message } = this.props;
    const darkMode = Settings.isDarkModeEnabled();

    const style = styleDirectionIsOutbound.get(message.isLocal);
    const bubbleStyle = darkMode ? style.darkMode : style.lightMode;

    return (
      <div className="fadeInFast" style={containerStyle}>
        <div style={bubbleStyle}>
          {message.body}
          {/*<div style={devMessageCountStyle}>{this.props.bubbleId}</div>*/}
        </div>
      </div>
    );
  }
}

export {
  ChatBubble,
};
