import React from 'react';
import {
  Button,
  Form,
  Header,
  Icon,
  Popup,
  Segment,
} from 'semantic-ui-react';
import { createSigningKeyPair } from '../../encryption';
import { clientEmitter } from '../../emitters/comms';
import { clientEmitterAction } from '../../emitters/clientEmitterAction';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { Accounts } from '../../storage/cacheFrontends/Accounts';
import { getSafeRandomIntInclusive, sha256 } from '../../utils';

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
      $modal.confirm(
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
        $modal.alert({
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
          clientEmitter.emit(clientEmitterAction.softReloadApp);
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
          <Form.Field>
            <label>
              Account Name (only you can see this)
              &nbsp;
              <Popup
                trigger={<Icon name="question" color="green" size="small"
                               inverted circular/>}
                content={
                  'This is for your own reference; it\'s used to tell your ' +
                  'accounts apart.'
                }
              />
            </label>
            <input
              autoFocus
              placeholder={accountError || 'Account Name'}
              value={accountName}
              onChange={(event) => {
                this.setState({ accountName: event.target.value });
              }}
            />
          </Form.Field>

          <Form.Field>
            <label>
              Personal Name (only contacts can see this)
              &nbsp;
              <Popup
                trigger={<Icon name="question" color="green" size="small"
                               inverted circular/>}
                content={
                  'This is what people see after you\'ve been added as a contact.'
                }
              />
            </label>
            <input
              placeholder="Personal Name"
              onChange={(event) => {
                this.setState({ personalName: event.target.value });
              }}
            />
          </Form.Field>
          <Form.Field>
            <label>
              Optional Public Name
              &nbsp;
              <Popup
                trigger={<Icon name="question" color="green" size="small"
                               inverted circular/>}
                content={
                  'If you want people to invite you to chats, you need to ' +
                  'have a public name. You can add / remove the account\'s ' +
                  'public name at any time. When you remove your name, ' +
                  'existing chats will not be affected and you will no ' +
                  'longer be searchable.'
                }
              />
            </label>
            <input
              placeholder="Public Name"
              onChange={(event) => {
                this.setState({ publicName: event.target.value });
              }}
            />
          </Form.Field>

          {/* TODO: make this optional later. Will require extra auth like
               email or whatever. */}
          {/*<Form.Field>*/}
          {/*  <Checkbox label="Save this account on the server"/>*/}
          {/*</Form.Field>*/}
          <Button
            icon
            primary
            type="submit"
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
