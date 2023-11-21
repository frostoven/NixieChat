import React from 'react';
import { LargeCircleIconButton } from '../Generic/LargeCircleIconButton';

class CreateFirstContact extends React.Component {
  createChat = () => {
    //
  };

  render() {
    return (
      <div style={{ textAlign: 'center' }}>
        <LargeCircleIconButton
          icon="user plus"
          label="Add your first contact"
        />

        <p><b>&mdash;&nbsp;&nbsp;or&nbsp;&nbsp;&mdash;</b></p>

        <LargeCircleIconButton
          icon="sticky note"
          label="Create encrypted notepad"
          iconStyle={{ paddingLeft: 15 }}
        />
      </div>
    );
  }
}

export {
  CreateFirstContact,
};
