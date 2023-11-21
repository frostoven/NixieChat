import React from 'react';
import { LargeCircleIconButton } from '../Generic/LargeCircleIconButton';

class CreateFirstChat extends React.Component {
  createChat = () => {
    //
  };

  render() {
    return (
      <div style={{ textAlign: 'center' }}>
        <LargeCircleIconButton
          icon="pencil alternate"
          label="Create your first chat"
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
  CreateFirstChat,
};
