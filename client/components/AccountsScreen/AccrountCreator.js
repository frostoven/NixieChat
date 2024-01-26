import React from 'react';
import {
  Button,
  Form,
  Header,
  Icon,
  Segment,
} from 'semantic-ui-react';
import { createSigningKeyPair } from '../../encryption';
import { clientEmitter } from '../../emitters/comms';
import { clientEmitterAction } from '../../emitters/clientEmitterAction';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { Accounts } from '../../storage/cacheFrontends/Accounts';
import { getSafeRandomIntInclusive } from '../../utils';
import { NxField } from '../Generic/NxField';

class AccountCreator extends React.Component {
  state = {
    accountName: '',
    personalName: '',
    publicName: '',
    accountError: '',
    buttonIcon: 'user circle',
    buttonText: 'Create',
    buttonDisabled: false,
  };

  create = () => {
    if (!this.state.accountName) {
      $dialog.confirm(
        'An account name is required. Would you like one randomly generated?',
        (shouldCreateAccount) => {
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
      buttonIcon: 'hourglass start',
      buttonText: 'Generating key pair...',
      buttonDisabled: true,
    }, async () => {

      let keyPair;
      try {
        keyPair = await createSigningKeyPair();
      }
      catch (error) {
        $dialog.alert({
          header: 'Error generating account',
          body: error.toString(),
        });
        return this.setState({ buttonText: 'Error creating account' });
      }

      // console.log({ keyPair });
      // console.log(await exportKeys(keyPair));
      // console.log(await exportKeys(keyPair, 'string'));


      this.setState({
        buttonIcon: 'hourglass end',
        buttonText: 'Saving...',
      }, async () => {
        const { accountName, personalName, publicName } = this.state;

        const fullPublicName =
          publicName ?
            `${publicName}#${getSafeRandomIntInclusive(1000, 9999)}` :
            '';

        await Accounts.createAccount({
          accountName,
          personalName,
          publicName: fullPublicName,
          keyPair,
          overwrite: false,
          updateUi: false,
        });
        setTimeout(() => {
          // The timeout is just so things don't move too fast and look like a
          // glitch fest.
          clientEmitter.emit(clientEmitterAction.reloadStorage);
        }, 250);
      });

    });
  };

  render() {
    const {
      accountError, accountName, buttonText, buttonIcon, buttonDisabled,
    } = this.state;

    const darkMode = Settings.isDarkModeEnabled();
    return (
      <Segment style={{ textAlign: 'left' }} inverted={!darkMode}>
        <Header>You have no accounts on this device</Header>
        <i>Note that accounts are stored only on your device and not uploaded
          to
          the server by default.</i>
        <br/>
        <br/>
        <Form>

          <NxField
            label="Account Name (only you can see this)"
            help={
              'This is for your own reference; it\'s used to tell your accounts apart.'
            }
            autoFocus
            placeholder={accountError || 'Account Name'}
            value={accountName}
            onChange={(event) => {
              this.setState({ accountName: event.target.value });
            }}
          />

          <NxField
            label="Personal Name (only contacts can see this)"
            help={'This is what people see after you\'ve been added as a contact.'}
            placeholder="Personal Name"
            onChange={(event) => {
              this.setState({ personalName: event.target.value });
            }}
          />

          <NxField
            label='Optional Public Name'
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
            labelPosition="left"
            onClick={this.create}
            disabled={buttonDisabled}
          >
            <Icon name={buttonIcon}/>
            {buttonText}
          </Button>
        </Form>
      </Segment>
    );
  }
}

export {
  AccountCreator,
};
