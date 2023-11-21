import React from 'react';
import { Grid } from 'semantic-ui-react';
import { CreateFirstContact } from '../ContactFinder/CreateFirstContact';
import { CreateFirstChat } from '../ChatCreator/CreateFirstChat';
import { NixieStorage } from '../../storage/NixieStorage';
import { ContactsList } from './ContactLists';

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
      <Grid stretched style={{ height: '100%' }}>
        <Grid.Column computer={6} tablet={6} mobile={16} /*style={{ backgroundColor: 'red' }}*/>
          <ContactsList/>
        </Grid.Column>
        <Grid.Column computer={10} tablet={10} className="computer only" /*style={{ backgroundColor: 'blue' }}*/>
          // active chat here
        </Grid.Column>
      </Grid>
    );
  }
}

export {
  ContactsAndChatGrid,
};
