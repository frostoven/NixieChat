import React from 'react';
import { Button, Icon } from 'semantic-ui-react';
import { LargeCircleIconButton } from '../Generic/LargeCircleIconButton';

class CreateFirstChat extends React.Component {
  createChat = () => {
    //
  };

  render() {
    return (
      <LargeCircleIconButton
        icon="pencil alternate"
        label="Create your first chat"
      />
    );
  }
}

export {
  CreateFirstChat,
};
