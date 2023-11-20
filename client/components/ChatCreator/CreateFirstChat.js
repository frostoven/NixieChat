import React from 'react';
import { Button, Icon } from 'semantic-ui-react';

class CreateFirstChat extends React.Component {
  render() {
    return (
      <Button style={{ textAlign: 'center', width: 200, height: 200, borderRadius: '100%' }}>
        <Icon size='big' name="pencil alternate" style={{ paddingLeft: 11 }}/>
        <br/><br/><br/>
        <b>Create your first chat</b>
      </Button>
    );
  }
}

export {
  CreateFirstChat,
};
