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
    // TODO: this no longer works because we've switched to promises. Pass in
    //  as prop instead.
    const accountStore = this.storage.getAccountStore();
    const accounts = Object.values(accountStore);
    return (
      <div>
        {accounts.length ? <AccountChooser/> : <AccountCreator/>}
      </div>
    );
  }
}

export {
  AccountsScreen,
};
