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
    //
  };

  static defaultProps = {
    //
  };

  handleChatClick = ({ name }) => {
    console.log('Clicked:', name);
  };

  genList = () => {
    const result = [];
    const darkMode = Settings.isDarkModeEnabled();
    const contactsList = accountsStorage.getActiveChats();
    for (let i = 0, len = contactsList.length; i < len; i++) {
      const contactInfo = contactsList[i];
      result.push({
        name: contactInfo.contactName,
        lastMessage: '^ᴗ^', // •ᴗ•   („• ֊ •„)   ^ᴗ^   ◕‿◕   (⌐■_■)  // https://kaomoji.ru/en/   https://emojidb.org/cute-kaomoji-faces-emojis
        photo: accountsStorage.generateRandomartAvatar(
          accountsStorage.getActiveAccount().accountName,
          contactInfo.internalContactId,
          darkMode,
        ) || null,
      });
    }

    const contactsJsx = [];

    for (let i = 0, len = result.length; i < len; i++) {
      const { name, lastMessage, photo } = result[i];
      contactsJsx.push(
        <div
          key={`contacts-list-${i}`}
          style={chatsListStyle}
          onClick={() => this.handleChatClick(result[i])}
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
