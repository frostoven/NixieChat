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
    const accounts = this.storage.getAccountList();
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
