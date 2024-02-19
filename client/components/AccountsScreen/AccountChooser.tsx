import { map } from 'lodash';
import React from 'react';
import { NixieStorage } from '../../storage/NixieStorage';
import {
  EncryptedAccountStorage,
} from '../../storage/EncryptedAccountStorage';
import {
  AccountCache,
} from '../../storage/EncryptedAccountStorage/types/AccountCache';
import { Icon, Message, Segment } from 'semantic-ui-react';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { ContextualHelp } from '../Generic/ContextualHelp';
import { PasswordChooser } from '../Generic/PasswordChooser';
import { AccountCreator } from './AccrountCreator';

const errorStyle: React.CSSProperties = {
  padding: 10,
  paddingLeft: 19,
  color: '#000',
};

const chooserText: React.CSSProperties = {
  fontSize: '13pt',
};

const segmentStyle: React.CSSProperties = {
  cursor: 'pointer',
};

const FancyButton = ({ onClick, children }) => {
  const darkMode = Settings.isDarkModeEnabled();
  return (
    <Segment
      inverted={!darkMode}
      raised
      style={segmentStyle}
      onClick={onClick}
    >
      {children}
    </Segment>
  );
};

const DashedOr = () => {
  return (
    <div>
      or
    </div>
  );
};

interface Props {
  onAccountActivated: Function,
}

interface State {
  statusMessage: string,
  requestPasswordFor: string,
  blockAnimation: boolean,
  showAccountCreator: boolean,
  error: string,
}

class AccountChooser extends React.Component<Props, State> {
  plaintextStorage = new NixieStorage();
  accountStorage = new EncryptedAccountStorage();

  state = {
    statusMessage: 'Account Login',
    requestPasswordFor: '',
    blockAnimation: false,
    showAccountCreator: false,
    error: '',
  };

  componentDidMount() {
    this.checkForAutoLogin();
  }

  checkForAutoLogin = () => {
    const accountStorage = this.accountStorage;
    const allAccounts = accountStorage.getAllAccountNames();
    // Note: This can happen immediately after app boot if the user has only
    // one account, and it's passwordless or has auto-login enabled.
    if (allAccounts.length === 1 && accountStorage.loginCount === 1) {
      accountStorage.setActiveAccount(allAccounts[0]);
      return this.props.onAccountActivated();
    }
  };

  getStatusIcon = (account: AccountCache) => {
    if (account.decryptedData === null) {
      return <Icon name="lock"/>;
    }
    else {
      return <Icon name="unlock"/>;
    }
  };

  decryptionFriendly = (account: AccountCache) => {
    if (account.decryptedData === null) {
      return '(locked)';
    }
    else {
      return '(unlocked)';
    }
  };

  onAccountClick = (account: AccountCache) => {
    this.setState({
      error: '',
      blockAnimation: true,
      requestPasswordFor: account.accountName,
    });
  };

  onCreateAccountClick = () => {
    this.setState({
      showAccountCreator: true,
    });
  };

  receivePassword = (password: string) => {
    const accountName = this.state.requestPasswordFor;
    this.setState({
      statusMessage: 'Attempting decryption...',
      requestPasswordFor: '',
    }, async () => {
      const success = await this.accountStorage.decryptAccount({
        accountName,
        password,
      });

      if (success) {
        this.accountStorage.setActiveAccount(accountName);
        this.props.onAccountActivated();
      }
      else {
        this.setState({
          statusMessage: 'Account Login',
          error: `Failed to decrypt ${accountName}`,
        });
      }
    });
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const allAccounts = this.accountStorage.getAllAccounts();
    const loginCount = this.accountStorage.loginCount;
    const totalAccounts = this.accountStorage.totalAccounts;
    const plural = totalAccounts === 1 ? '' : 's';

    const {
      requestPasswordFor,
      showAccountCreator,
      statusMessage,
      blockAnimation,
      error,
    } = this.state;

    if (showAccountCreator) {
      return (
        <AccountCreator
          showCancelButton={true}
          onCancel={() => {
            this.setState({
              showAccountCreator: false,
            });
          }}
        />
      );
    }

    if (requestPasswordFor) {
      return (
        <PasswordChooser
          header={requestPasswordFor}
          body={null}
          noConfirm={true}
          usernameHint={requestPasswordFor}
          autoComplete={'current-password'}
          onChoosePassword={this.receivePassword}
        />
      );
    }

    return (
      <div className={blockAnimation ? '' : 'fadeInDown'}>
        <div style={chooserText}>
          <b>{statusMessage}</b><br/>

          {totalAccounts} account{plural} available, {loginCount} unlocked<br/>
          <br/>

          Locked accounts will not receive any messages&nbsp;
          <ContextualHelp>
            In order to receive messages for an account, NixieChat needs to
            tell the routing servers which routing information to use.
            <br/><br/>

            Routing information is encrypted and thus hidden, so accounts need
            to be unlocked to relay this information to the servers.
          </ContextualHelp>
        </div>

        {error && <Message color="yellow" style={errorStyle}>
          {error}
        </Message>}

        {map(allAccounts, (account: AccountCache, name: string) => {
          return (
            <FancyButton
              key={`AccountEntry${name}`}
              onClick={() => this.onAccountClick(account)}
            >
              {this.getStatusIcon(account)}
              {account.accountName} | {this.decryptionFriendly(account)}
            </FancyButton>
          );
        })}

        <div>
          - or -
        </div>

        <FancyButton onClick={this.onCreateAccountClick}>
          Create a new local account
        </FancyButton>
        <br/>
      </div>
    );
  }
}

export {
  AccountChooser,
};
