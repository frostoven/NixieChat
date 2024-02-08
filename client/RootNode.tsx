import React from 'react';
import './modal';
import { clientEmitter } from './emitters/comms';
import { NixieStorage } from './storage/NixieStorage';
import { AccountsScreen } from './components/AccountsScreen';
import { MainSection } from './components/MainSection';
import { clientEmitterAction } from './emitters/clientEmitterAction';

class RootNode extends React.Component {
  state = {
    booting: true,
    loggedIn: false,
  };

  storage = new NixieStorage();

  componentDidMount() {
    clientEmitter.on(clientEmitterAction.reloadApp, async () => {
      this.setState({
        loggedIn: !!this.storage.lastActiveAccount,
        booting: false,
      });
    });
  }

  render() {
    const { booting, loggedIn } = this.state;

    if (booting) {
      return <div>Starting up...</div>;
    }
    else if (!loggedIn) {
      return <AccountsScreen/>;
    }
    else {
      return (
        <MainSection/>
      );
    }
  }
}

export {
  RootNode,
}
