import React from 'react';
import { LargeCircleIconButton } from '../Generic/LargeCircleIconButton';

class CreateFirstContact extends React.Component {
  render() {
    return (
      <LargeCircleIconButton
        icon='user plus'
        label='Add your first contact'
      />
    )
  }
}

export {
  CreateFirstContact,
}
