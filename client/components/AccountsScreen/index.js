import React from 'react';
import { AccountChooser } from './AccountChooser';
import { AccountCreator } from './AccrountCreator';
import { Accounts } from '../../storage/Accounts';
import { Settings } from '../../storage/Settings';
import { Button } from 'semantic-ui-react';

const headerStyle = {
  textAlign: 'center',
  color: '#fff',
  fontWeight: 'bold',
  paddingTop: 14,
};

const accountsScreenStyle = {
  position: 'fixed',
  top: 0, bottom: 0, left: 0, right: 0,
  textAlign: 'center',
  margin: 0,
  overflow: 'auto',
};

const chatBgStyle = {
  // Generated using https://mycolor.space/gradient3?ori=to+right+bottom&hex=%23DBDDBB&hex2=%2388B884&hex3=%23D5D88D&submit=submit
  backgroundImage: 'linear-gradient(to right bottom, #dbddbb, #ced6af, #c0cfa3, #b0c898, #a0c18f, #9ec18c, #9cc188, #9ac185, #a8c786, #b7cd88, #c6d38a, #d5d88d)',
  ...accountsScreenStyle,
};

const chatBgStyleInverted = {
  backgroundImage: 'revert',
  ...accountsScreenStyle,
};

const themeButtonStyle = {
  position: 'fixed',
  right: 8,
  top: 12,
  fontSize: '75%',
};

class AccountsScreen extends React.Component {
  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const accounts = Accounts.getAccountCollection();
    return (
      <>
        <div style={darkMode ? chatBgStyleInverted : chatBgStyle}>
          <h3 style={headerStyle}>
            NixieChat
          </h3>
          <div style={{ maxWidth: 640, margin: 'auto' }}>
            {accounts.length ? <AccountChooser/> : <AccountCreator/>}
          </div>
        </div>

        <Button style={themeButtonStyle} onClick={Settings.toggleDarkMode}>
          Dark Mode
        </Button>
      </>
    );
  }
}

export {
  AccountsScreen,
};
