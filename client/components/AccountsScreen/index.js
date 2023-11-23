import React from 'react';
import { AccountChooser } from './AccountChooser';
import { AccountCreator } from './AccrountCreator';
import { Accounts } from '../../storage/Accounts';

const loginContainerStyle = {
  maxWidth: '400',
  borderRadius: 4,
};

class AccountsScreen extends React.Component {
  render() {
    const accounts = Accounts.getAccounts();
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
