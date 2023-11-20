import React from 'react';
import { Grid } from 'semantic-ui-react';

class ContactsAndChatGrid extends React.Component {
  render() {
    return (
      <Grid stretched style={{ height: '100%' }}>
        <Grid.Column computer={6} tablet={8} mobile={16} style={{ backgroundColor: 'red' }}>
          // contacts here
        </Grid.Column>
        <Grid.Column computer={10} tablet={8} className="computer only" style={{ backgroundColor: 'blue' }}>
          // active chat here
        </Grid.Column>
      </Grid>
    );
  }
}

export {
  ContactsAndChatGrid,
};
