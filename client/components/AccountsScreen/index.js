import React from 'react';
import { NixieStorage } from '../../storage/NixieStorage';
import { AccountChooser } from './AccountChooser';
import { AccountCreator } from './AccrountCreator';

const loginContainerStyle = {
  maxWidth: '400',
  borderRadius: 4,
};

class AccountsScreen extends React.Component {
  static defaultProps = {
    //
  };

  storage = new NixieStorage();

  render() {
    const accounts = this.storage.accountCollectionCache;
    return (
      <div style={{ width: '100%', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: 'auto' }}>
          {accounts.length ? <AccountChooser/> : <AccountCreator/>}
        </div>
      </div>
    );
  }
}

export {
  AccountsScreen,
};
