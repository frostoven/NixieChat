import React from 'react';
import { Grid } from 'semantic-ui-react';
import { OngoingChatsList } from './OngoingChatsList';
import { ActiveChat } from './ActiveChat';
import {
  UnencryptedSettings,
} from '../../storage/cacheFrontends/UnencryptedSettings';
import {
  EncryptedAccountStorage,
} from '../../storage/EncryptedAccountStorage';
import { CreateFirstContact } from '../ContactComponents/CreateFirstContact';
import { microRouter } from '../../frostLib/microRouter';

const accountsStorage = new EncryptedAccountStorage();

/** @type React.CSSProperties */
const newAccountOptionsStyle = {
  position: 'fixed',
  width: '100%',
  height: '100%',
  paddingLeft: '25%',
  paddingRight: '25%',
  zIndex: 6,
  overflow: 'auto',
};

/** @type React.CSSProperties */
const columnStyle = {
  height: '100%',
  paddingTop: 0,
  paddingBottom: 0,
};

/** @type React.CSSProperties */
const columnLeftStyle = {
  ...columnStyle,
  paddingRight: 0,
};

/** @type React.CSSProperties */
const columnRightStyle = {
  ...columnStyle,
  paddingLeft: 0,
};

// Used to switch between exclusively showing the chat or the contact chat list
// on small screens. Note that Semantic UI requires that all visible columns
// always add up to 16 for each display type.
const columnConfig = {
  chatIsOpen: {
    leftColProps: {
      computer: 6,
      tablet: 6,
      only: 'tablet computer',
    },
    rightColProps: {
      computer: 10,
      tablet: 10,
      mobile: 16,
    },
  },
  chatIsClosed: {
    leftColProps: {
      computer: 6,
      tablet: 6,
      mobile: 16,
    },
    rightColProps: {
      computer: 10,
      tablet: 10,
      // This should technically be zero, but Semantic only allows 1-16.
      mobile: 1,
    },
  },
};

class ContactsAndChatGrid extends React.Component {
  state = {
    accountName: '',
    messageDetachableId: '',
  };

  onCloseChat = () => {
    this.setState({
      messageDetachableId: '',
    });
  };

  onOpenChat = ({ accountName, messageDetachableId }) => {
    this.setState({
      accountName,
      messageDetachableId,
    });

    microRouter.changeRoute({
      to: 'chat',
      nav: { back: '/' },
      onBackTriggered: () => {
        this.onCloseChat();
      },
    });
  };

  render() {
    const darkMode = UnencryptedSettings.isDarkModeEnabled();
    const contacts = accountsStorage.getActiveContacts();

    const { accountName, messageDetachableId } = this.state;

    if (!contacts.length) {
      return (
        <>
          <div style={newAccountOptionsStyle}>
            <br/><br/>
            <CreateFirstContact/>
          </div>

          <Grid stretched style={columnLeftStyle} inverted={!darkMode}>
            <Grid.Column style={columnRightStyle}>
              <ActiveChat
                accountName={accountName}
                messageDetachableId={messageDetachableId}
                onCloseChat={this.onCloseChat}
              />
            </Grid.Column>
          </Grid>
        </>
      );
    }

    let leftColProps, rightColProps;
    if (messageDetachableId) {
      leftColProps = columnConfig.chatIsOpen.leftColProps;
      rightColProps = columnConfig.chatIsOpen.rightColProps;
    }
    else {
      leftColProps = columnConfig.chatIsClosed.leftColProps;
      rightColProps = columnConfig.chatIsClosed.rightColProps;
    }

    return (
      <>
        {/* Contacts and chat are contained in this grid. */}
        <Grid stretched style={columnStyle} inverted={!darkMode}>
          <Grid.Column
            {...leftColProps}
            style={columnLeftStyle}
          >
            <OngoingChatsList
              onOpenChat={this.onOpenChat}
            />
          </Grid.Column>
          <Grid.Column
            className="mobile-margin-fix"
            {...rightColProps}
            style={columnRightStyle}
          >
            <ActiveChat
              accountName={accountName}
              messageDetachableId={messageDetachableId}
              onCloseChat={this.onCloseChat}
            />
          </Grid.Column>
        </Grid>
      </>
    );
  }
}

export {
  ContactsAndChatGrid,
};
