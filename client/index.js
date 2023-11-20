import React from 'react';
import ReactDOM from 'react-dom';
import './modal';
import { serverEmitter } from './comms';
import { NixieStorage } from './storage/NixieStorage';
import { AccountsScreen } from './components/AccountsScreen';
import { MainSection } from './components/MainSection';

/**
 * TODO list:
 *  * create a login screen
 *  * allow creation of accounts in the login screen [explain they need to be backed up]
 *  * if you allow yourself to be found, you ca be searched or if they know your exact name
 *  * every chat is multi-user. new users may request all past plaintext messages from other
 *    people in the chat. if they refuse, then you need to resync plaintext from others to
 *    see new messages from exising user.
 *  * all messages are internally stored as jpg or png. if another is sent, convert to jpg
 *    or png depending on whether or not the source is lossless.
 *  * create a SHA-256 address of the person's public key.
 */

class RootNode extends React.Component {
  static defaultState = {
    booting: true,
    loggedIn: false,
  };

  storage = new NixieStorage();

  constructor(props) {
    super(props);
    this.state = { ...RootNode.defaultState };
  }

  componentDidMount() {
    this.initAccount();
  }

  initAccount = () => {
    this.storage.initStorage().then(async () => {
      const accounts = await this.storage.getAccountStore();
      console.log('--->', accounts);
      if (!Object.values(accounts).length) {
        return this.setState({
          loggedIn: false,
          booting: false,
        });
      }
    });
  };

  setupServerListeners = () => {
    //
  };

  render() {
    const { booting, loggedIn } = this.state;

    if (booting) {
      return <div>Starting up...</div>;
    }
    else if (!loggedIn) {
      return <AccountsScreen/>;
    }

    return (
      <MainSection/>
    );
  }
}

const domContainer = document.querySelector('#react-element');
const element = React.createElement;
ReactDOM.render(element(RootNode), domContainer);
