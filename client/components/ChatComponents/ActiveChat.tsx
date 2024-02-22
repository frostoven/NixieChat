import React from 'react';
import PropTypes from 'prop-types';
import { Settings } from '../../storage/cacheFrontends/Settings';
import {
  EncryptedAccountStorage,
} from '../../storage/EncryptedAccountStorage';
import { ChatBox } from './ChatBox';

const accountStorage = new EncryptedAccountStorage();

const chatBgStyle = {
  // Generated using https://mycolor.space/gradient3?ori=to+right+bottom&hex=%23DBDDBB&hex2=%2388B884&hex3=%23D5D88D&submit=submit
  backgroundImage: 'linear-gradient(to right bottom, #dbddbb, #ced6af, #c0cfa3, #b0c898, #a0c18f, #9ec18c, #9cc188, #9ac185, #a8c786, #b7cd88, #c6d38a, #d5d88d)',
};

const chatBgStyleInverted = {
  backgroundImage: 'revert',
};

const chatFgStyle: React.CSSProperties = {
  height: '100%',
  backgroundImage: 'url(/assets/backgrounds/defaultPattern.svg)',
  backgroundSize: 392,
  opacity: 0.2,
};

const chatContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0, bottom: 0, left: 0, right: 0,
  paddingBottom: 12,
};

const chatAreaStyle: React.CSSProperties = {
  position: 'relative',
  height: '100%',
};

interface Props {
  accountName: string,
  messageDetachableId: string,
  onCloseChat: Function,
}

class ActiveChat extends React.Component<Props> {
  // The PropTypes package does compile-time checks, which is why use this as
  // well as a Props interface.
  static propTypes = {
    accountName: PropTypes.string.isRequired,
    messageDetachableId: PropTypes.string.isRequired,
    onCloseChat: PropTypes.func.isRequired,
  };

  genChat = () => {
    const { accountName, messageDetachableId, onCloseChat } = this.props;
    if (!messageDetachableId) {
      return null;
    }

    const chatCache = accountStorage.getMessages({
      messageDetachableId,
      count: 37,
    });

    return (
      <>
        <ChatBox
          accountName={accountName}
          messageDetachableId={messageDetachableId}
          onCloseChat={onCloseChat}
        />
      </>
    );
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const bgStyle = darkMode ? chatBgStyleInverted : chatBgStyle;
    return (
      <>
        <div style={bgStyle}>
          <div style={chatFgStyle}/>
        </div>
        <div style={chatContainerStyle}>
          <div style={chatAreaStyle}>
            {this.props.messageDetachableId}
            {this.genChat()}
          </div>
        </div>
      </>
    );
  }
}

export {
  ActiveChat,
};
