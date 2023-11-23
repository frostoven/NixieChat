import React from 'react';
import { Grid } from 'semantic-ui-react';
import { CreateFirstContact } from '../ContactFinder/CreateFirstContact';
import { CreateFirstChat } from '../ChatCreator/CreateFirstChat';
import { NixieStorage } from '../../storage/NixieStorage';
import { OngoingChatsList } from './OngoingChatsList';
import { ActiveChat } from './ActiveChat';
import { uiGlobals } from '../../config/uiGlobals';

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
  storage = new NixieStorage();

  render() {
    const accounts = this.storage.accountCollectionCache;
    if (!accounts.length) {
      //
    }

    // If the user has no contacts:
    // return <CreateFirstContact/>;
    //
    // If the user has no chats:
    // return <CreateFirstChat/>;

    return (
      <Grid stretched style={columnLeftStyle} inverted={!uiGlobals.darkMode}>
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
