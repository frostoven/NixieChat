import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Form,
  Header,
  Icon,
  Segment,
} from 'semantic-ui-react';
import { createSigningKeyPair } from '../../encryption';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { getSafeRandomIntInclusive } from '../../utils';
import { NxField } from '../Generic/NxField';
import {
  EncryptedAccountStorage,
} from '../../storage/EncryptedAccountStorage';
import { PasswordChooser } from '../Generic/PasswordChooser';
import { AutoKeyMap } from '../../events/AutoKeyMap';
import { randomAccountName } from '../../../shared/textGen';

const accountStore = new EncryptedAccountStorage();

const CHROMIUM_LINK = 'https://www.chromium.org/getting-involved/download-chromium/';
const FIREFOX_LINK = 'https://www.mozilla.org/';

// const SAFARI_7D = 'https://gist.github.com/pesterhazy/4de96193af89a6dd5ce682ce2adff49a#state-deleted-after-7-days-of-inactivity-safari';

function randomName() {
  return randomAccountName(3, false, [ 'Account' ]);
}

/** @type React.CSSProperties */
const linkStyle = {
  color: 'inherit',
  textDecoration: 'underline',
  marginLeft: 2,
  marginRight: 2,
};

/** @type React.CSSProperties */
const rerollStyle = {
  padding: 0,
  paddingLeft: 18,
  paddingRight: 8,
};

class AccountCreator extends React.Component {
  autoKeyMap = new AutoKeyMap();

  static propTypes = {
    showCancelButton: PropTypes.bool,
    onCancel: PropTypes.func,
  };

  static defaultProps = {
    showCancelButton: false,
    onCancel: () => {
    },
  };

  state = {
    accountName: randomName(),
    personalName: '',
    publicName: '',
    accountError: '',
    buttonIcon: 'user circle',
    primaryButtonText: 'Create',
    formDisabled: false,
    showPasswordPrompt: false,
  };

  componentDidMount() {
    this.autoKeyMap.bindKeys({
      Enter: this.requestPassword,
      NumpadEnter: this.requestPassword,
      Escape: this.props.onCancel,
    });
  }

  requestPassword = () => {
    if (this.state.formDisabled) {
      return;
    }

    if (!this.state.accountName) {
      this.autoKeyMap.pause();
      $dialog.confirm(
        'An account name is required. Would you like one randomly generated?',
        (shouldCreateAccount) => {
          this.autoKeyMap.resume();
          if (shouldCreateAccount) {
            let accountNumber = `${getSafeRandomIntInclusive(100, 999)}`;
            const accountName = `Account${accountNumber}`;
            this.setState({ accountName });
          }
        });
      return this.setState({
        accountError: 'An account name is required',
      });
    }

    this.setState({
      formDisabled: true,
      showPasswordPrompt: true,
    });
  };

  setPassword = (password) => {
    this.setState({
      showPasswordPrompt: false,
      buttonIcon: 'hourglass start',
      primaryButtonText: 'Generating key pair...',
      formDisabled: true,
    }, () => {
      this.createKeyPair(password).catch(console.error);
    });
  };

  createKeyPair = async (password) => {
    let keyPair;
    try {
      keyPair = await createSigningKeyPair();
    }
    catch (error) {
      $dialog.alert({
        header: 'Error generating account',
        body: error.toString(),
      });
      return this.setState({ primaryButtonText: 'Error creating account' });
    }

    this.setState({
      buttonIcon: 'hourglass end',
      primaryButtonText: 'Saving...',
    }, async () => {
      this.createAccount(keyPair, password).catch(console.error);
    });
  };

  createAccount = async (keyPair, password) => {
    const { accountName, personalName, publicName } = this.state;

    const fullPublicName =
      publicName ?
        `${publicName}#${getSafeRandomIntInclusive(1000, 9999)}` :
        '';

    const storage = new EncryptedAccountStorage();
    storage.createAccount({
      accountName,
      personalName,
      publicName: fullPublicName,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      overwrite: false,
      password,
    }).catch((error) => {
      console.error('[AccountCreator]', error);
      this.setState({
        primaryButtonText: error.toString(),
      });
    });
  };

  randomizeName = () => {
    if (this.state.formDisabled) {
      return;
    }
    this.setState({
      accountName: randomName(),
    });
  };

  render() {
    if (this.state.showPasswordPrompt) {
      return (
        <PasswordChooser
          header="Account Password"
          autoComplete={'new-password'}
          usernameHint={this.state.accountName}
          help={
            'This will encrypt your contacts list, account info, and chat ' +
            'passwords.'
          }
          body={
            <>
              Would you like to encrypt your account with a password?

              <br/><br/>

              <i>
                Warning: if you lose your password, you lose your account.
                Password-protected accounts are AES-256 encrypted; this means
                THERE'S NO WAY TO RESET YOUR PASSWORD. {/*You will be able to
                download recovery keys if you've not yet forgotten your
                password, which can act as a password.*/}
              </i>

              <br/><br/>
            </>
          }
          onChoosePassword={this.setPassword}
        />
      );
    }

    const { showCancelButton, onCancel } = this.props;
    const {
      accountError, accountName, primaryButtonText, buttonIcon, formDisabled,
    } = this.state;

    let headerText;
    if (!accountStore.totalAccounts) {
      headerText = 'You have no accounts on this device';
    }
    else {
      headerText = 'Creating a new local account';
    }

    const darkMode = Settings.isDarkModeEnabled();
    return (
      <Segment style={{ textAlign: 'left' }} inverted={!darkMode}>
        <Header>{headerText}</Header>
        <i>Note that accounts are stored only on your device and not uploaded
          to the server by default.</i>
        <br/>
        <br/>
        <Form>

          <NxField
            label="Account Name (only you can see this)"
            help={
              <div>
                This is for your own reference; it's used to tell your accounts
                apart.
                <br/><br/>
                This name won't be encrypted, and is stored as plaintext.
              </div>
            }
            autoFocus
            placeholder={accountError || 'Account Name'}
            value={accountName}
            disabled={formDisabled}
            rightSideComponent={
              <Button
                key={'nameRandomizer'}
                disabled={formDisabled}
                style={rerollStyle} color="olive"
                onClick={this.randomizeName}
              >
                <Icon name="refresh"/>
              </Button>
            }
            onChange={(event) => {
              this.setState({ accountName: event.target.value });
            }}
          />

          <NxField
            label="Personal Alias (only contacts can see this)"
            help={'The default name used when adding new contacts.'}
            disabled={formDisabled}
            placeholder="Personal Name"
            onChange={(event) => {
              this.setState({ personalName: event.target.value });
            }}
          />

          <NxField
            label="Optional Public Name (needed to add you as a contact)"
            help={
              <div>
                If you want people to invite you to chats, you need to have a
                public name. You can add / remove the account's public name
                at any time. When you remove your name, existing chats will
                not be affected and you will no longer be searchable.
                <br/><br/>
                This field is automatically suffixed with a random number.
              </div>
            }
            disabled={formDisabled}
            placeholder="Public Name"
            onChange={(event) => {
              this.setState({ publicName: event.target.value });
            }}
          />

          {/* TODO: make this optional later. Will require extra auth like
               email or whatever. */}
          {/*<Form.Field>*/}
          {/*  <Checkbox label="Save this account on the server"/>*/}
          {/*</Form.Field>*/}
          <Button
            icon
            primary
            type="button"
            labelPosition="right"
            onClick={this.requestPassword}
            disabled={formDisabled}
          >
            <Icon name={buttonIcon}/>
            {primaryButtonText}
          </Button>

          <Button
            icon
            primary
            type="button"
            labelPosition="right"
            onClick={onCancel}
            disabled={formDisabled}
            style={{ display: showCancelButton ? 'inline-block' : 'none' }}
          >
            <Icon name={'level down alternate'}/>
            Cancel
          </Button>

          {/* TODO: Add right-aligned button: "Import From Another Device"*/}
        </Form>

        <br/>
        <i>
          We recommend using NixieChat with either
          <a style={linkStyle} href={CHROMIUM_LINK} target="_blank">
            Chromium
          </a>
          or
          <a style={linkStyle} href={FIREFOX_LINK} target="_blank">
            Firefox
          </a>.
        </i>

        {/* Include this? Is it useful or distracting? And does Safari still
            have these issues?
          Chrome will suffice if you trust Google. Please do not use
          Safari, it has a tendency to corrupt message data (or outright &nbsp;
          <a style={linkStyle} href={SAFARI_7D} target="_blank">
            delete all data
          </a>
          &nbsp; after a week). We cannot fix Safari's issues because that
          would require personally identifying you, something that goes against
          NixieChat's reason for existing. We also advise against Microsoft's
          Edge as it has compatibility and trust issues.

        <i>
          Chromium appears to offer the most stable experience at this time.
        </i>

         TODO: Offer alternative in the form of a desktop app:
         Alternatively, you may download the NixieChat desktop app which does
         not suffer these issues.
      */}
      </Segment>
    );
  }
}

export {
  AccountCreator,
};
