import React from 'react';
import { Grid } from 'semantic-ui-react';
import { OngoingChatsList } from './OngoingChatsList';
import { ActiveChat } from './ActiveChat';
import { Settings } from '../../storage/cacheFrontends/Settings';
import {
  EncryptedAccountStorage,
} from '../../storage/EncryptedAccountStorage';
import { CreateFirstContact } from '../ContactComponents/CreateFirstContact';

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

class ContactsAndChatGrid extends React.Component {
  state = {
    messageDetachableId: '',
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const contacts = accountsStorage.getActiveContacts();

    // If the user has no chats:
    // return <CreateFirstChat/>;

    if (!contacts.length) {
      return (
        <>
          <div style={newAccountOptionsStyle}>
            <br/><br/>
            <CreateFirstContact/>
          </div>

          <Grid stretched style={columnLeftStyle} inverted={!darkMode}>
            <Grid.Column style={columnRightStyle}>
              <ActiveChat messageDetachableId={this.state.messageDetachableId}/>
            </Grid.Column>
          </Grid>
        </>
      );
    }

    return (
      <>
        {/* Contacts and chat are contained in this grid. */}
        <Grid stretched style={columnLeftStyle} inverted={!darkMode}>
          <Grid.Column
            computer={6} tablet={6} mobile={16}
            style={columnLeftStyle}
          >
            <OngoingChatsList
              onOpenChat={({ messageDetachableId }) => {
                this.setState({
                  messageDetachableId: messageDetachableId,
                });
              }}
            />
          </Grid.Column>
          <Grid.Column
            computer={10} tablet={10} className="computer only"
            style={columnRightStyle}
          >
            <ActiveChat messageDetachableId={this.state.messageDetachableId}/>
          </Grid.Column>
        </Grid>
      </>
    );
  }
}

export {
  ContactsAndChatGrid,
};