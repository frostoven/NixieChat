import React from 'react';
import PropTypes from 'prop-types';
import { AccountChooser } from './AccountChooser';
import { AccountCreator } from './AccountCreator';
import {
  UnencryptedSettings,
} from '../../storage/cacheFrontends/UnencryptedSettings';
import { Button } from 'semantic-ui-react';
import {
  UnencryptedSettingsStore,
} from '../../storage/UnencryptedSettingsStore';
import {
  EncryptedAccountStorage,
} from '../../storage/EncryptedAccountStorage';

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
  zIndex: 1,
};

const chatBgStyle = {
  // Generated using https://mycolor.space/gradient3?ori=to+right+bottom&hex=%23DBDDBB&hex2=%2388B884&hex3=%23D5D88D&submit=submit
  backgroundImage: 'linear-gradient(to right bottom, #dbddbb, #ced6af, #c0cfa3, #b0c898, #a0c18f, #9ec18c, #9cc188, #9ac185, #a8c786, #b7cd88, #c6d38a, #d5d88d)',
  ...accountsScreenStyle,
};

const chatBgStyleInverted = {
  backgroundColor: '#464646',
  ...accountsScreenStyle,
};

const themeButtonStyle = {
  position: 'fixed',
  right: 8,
  top: 12,
  fontSize: '75%',
  zIndex: 1,
};

class AccountsScreen extends React.Component {
  static propTypes = {
    onAccountActivated: PropTypes.func.isRequired,
  };

  plaintextStorage = new UnencryptedSettingsStore();
  accountStorage = new EncryptedAccountStorage();

  handleDarkModeToggle = () => {
    UnencryptedSettings.toggleDarkMode().catch(console.error);
    this.forceUpdate();
  };

  render() {
    const { onAccountActivated } = this.props;
    const darkMode = UnencryptedSettings.isDarkModeEnabled();
    const formStyle = darkMode ? chatBgStyleInverted : chatBgStyle;
    const totalAccounts = this.accountStorage.totalAccounts;

    return (
      <div>
        <div className="fadeInDown" style={formStyle}>
          <h3 style={headerStyle}>
            Frostoven's NixieChat
          </h3>
          <div style={{ maxWidth: 640, margin: 'auto' }}>
            {
              totalAccounts ?
                <AccountChooser onAccountActivated={onAccountActivated}/> :
                <AccountCreator onAccountActivated={onAccountActivated}/>
            }
          </div>
        </div>

        <Button
          secondary
          style={themeButtonStyle}
          onClick={this.handleDarkModeToggle}
        >
          Dark Mode
        </Button>
      </div>
    );
  }
}

export {
  AccountsScreen,
};
