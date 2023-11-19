import React from 'react';
import { getDiffieHellman } from 'diffie-hellman';

class ChatCreator extends React.Component {
  static propTypes = {
    //
  };

  static defaultProps = {
    //
  };

  diffieHellmanExample() {
    console.log('-> get generators [v4]');
    // modp16 is 4096 bits. this lib also supports: modp17 (6144 bits) and
    // modp18 (8192 bits). stings the nostrils.
    const alice = getDiffieHellman('modp16');
    const bob = getDiffieHellman('modp16');

    console.log('-> generate keys');
    alice.generateKeys();
    bob.generateKeys();

    console.log('-> keys:');
    console.log(' > alice:', { public: alice.getPublicKey(), private: alice.getPrivateKey() });
    console.log(' > bob:', { public: bob.getPublicKey(), private: bob.getPrivateKey() });

    console.log('-> compute secrets');
    const aliceSecret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
    const bobSecret = bob.computeSecret(alice.getPublicKey(), null, 'hex');

    /* aliceSecret and bobSecret should be the same */
    console.log('-> Results:', { aliceSecret, bobSecret });
  }

  render() {
    return (
      <div>
        //
      </div>
    )
  }
}

export {
  ChatCreator,
}
