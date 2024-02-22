import React from 'react';
import PropTypes from 'prop-types';
import {
  EncryptedAccountStorage,
} from '../../storage/EncryptedAccountStorage';
import { Settings } from '../../storage/cacheFrontends/Settings';

const accountsStorage = new EncryptedAccountStorage();

const chatsListStyle = {
  // borderBottom: 'thin solid grey',
  paddingLeft: 2,
  paddingTop: 12,
  paddingBottom: 12,
  cursor: 'pointer',
};

const listStyle = {
  width: '100%',
  height: '100%',
  borderRight: 'thin solid grey',
  overflowY: 'auto',
};

const profilePhotoContainer = {
  display: 'inline-block',
  verticalAlign: 'top',
};

const profileIconStyle = {
  borderRadius: '100%',
  backgroundColor: 'grey',
  width: 42,
  height: 42,
  marginLeft: 4,
  marginRight: 12,
};

const contactInfoContainer = {
  display: 'inline-block',
};

const taperedLineStyle = {
  borderRadius: '15%',
  width: '97%',
  backgroundColor: 'grey',
  height: 1,
  margin: 'auto',
};

class OngoingChatsList extends React.Component {
  static propTypes = {
    onOpenChat: PropTypes.func.isRequired,
  };

  genList = () => {
    const result = [];
    const darkMode = Settings.isDarkModeEnabled();
    const chatList = accountsStorage.getActiveChats();
    const accountName = accountsStorage.getActiveAccount().accountName;
    for (let i = 0, len = chatList.length; i < len; i++) {
      const chatInfo = chatList[i];
      result.push({
        name: chatInfo.contactName,
        lastMessage: '^ᴗ^',
        photo: accountsStorage.generateRandomartAvatar(
          accountName,
          chatInfo.internalContactId,
          darkMode,
        ) || null,
        onClick: () => {
          this.props.onOpenChat({
            accountName,
            messageDetachableId: chatInfo.messageDetachableId,
          });
        },
      });
    }

    const contactsJsx = [];

    for (let i = 0, len = result.length; i < len; i++) {
      const { name, lastMessage, photo, onClick } = result[i];
      contactsJsx.push(
        <div
          key={`contacts-list-${i}`}
          style={chatsListStyle}
          onClick={onClick}
        >

          {/* Contact profile photo */}
          <div style={profilePhotoContainer}>
            <img alt="DP" src={photo} style={profileIconStyle}/>

            {/* Dev note: Use the following instead for a square preview. */}
            {/*<div style={profileIconStyle}>*/}
            {/*  <img src={photo}/>*/}
            {/*</div>*/}
          </div>

          {/* Contact name and recent message */}
          <div style={contactInfoContainer}>
            <div>
              <div><b>{name}</b></div>
              <div>{lastMessage}</div>
            </div>
          </div>

        </div>,
        <div style={taperedLineStyle} key={`chat-separator-${i}`}>
          &nbsp;
        </div>,
      );
    }

    return contactsJsx;
  };

  render() {
    return (
      <div style={listStyle}>
        {this.genList()}
      </div>
    );
  }
}

export {
  OngoingChatsList,
};
