import React from 'react';
import { Grid } from 'semantic-ui-react';
import { OngoingChatsList } from './OngoingChatsList';
import { ActiveChat } from './ActiveChat';
import { Settings } from '../../storage/Settings';
import { Accounts } from '../../storage/Accounts';
import { CreateFirstContact } from '../ContactFinder/CreateFirstContact';

const columnStyle = {
  height: '100%',
  paddingTop: 0,
  paddingBottom: 0,
};

const columnLeftStyle = {
  ...columnStyle,
  paddingRight: 0,
};

const columnRightStyle = {
  ...columnStyle,
  paddingLeft: 0,
};

class ContactsAndChatGrid extends React.Component {
  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const accounts = Accounts.getAccountCollection();
    const a = Accounts.getActiveAccount();

    console.log('--> last active:', Accounts.getActiveAccount());

    // if (!accounts.contacts.length) {
    //   // User has no contacts yet.
    //   return <CreateFirstContact/>;
    // }

    // If the user has no chats:
    // return <CreateFirstChat/>;

    return (
      <Grid stretched style={columnLeftStyle} inverted={!darkMode}>
        <Grid.Column
          computer={6} tablet={6} mobile={16}
          style={columnLeftStyle}
        >
          <OngoingChatsList/>
        </Grid.Column>
        <Grid.Column
          computer={10} tablet={10} className="computer only"
          style={columnRightStyle}
        >
          <ActiveChat/>
        </Grid.Column>
      </Grid>
    );
  }
}

export {
  ContactsAndChatGrid,
};
