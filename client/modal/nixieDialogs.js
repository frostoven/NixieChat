import React from 'react';
import { ContactFinder } from '../components/ContactComponents/ContactFinder';
import { exportRsaPublicKey, importRsaPublicKey } from '../encryption/rsa';
import {
  ReceiveInvitation,
} from '../components/ContactComponents/ReceiveInvitation';

function showAddContactDialog() {
  $modal.alert({
    header: 'Add contact',
    body: <ContactFinder/>,
    actions: [],
  });
}

async function showInvitationDialog({
  ownName,
  requestId,
  source,
  greeting,
  pubKey,
  time,
} = {}) {
  if (
    typeof requestId !== 'string' ||
    typeof source !== 'string' ||
    typeof greeting !== 'string' ||
    !(pubKey instanceof ArrayBuffer) ||
    typeof time !== 'number'
  ) {
    console.log(
      '[receiveInvite] Received malformed invite. Dump:',
      { requestId, source, greeting, pubKey, time },
    );
    return;
  }

  // Node sends this as an ArrayBuffer, so we wrap it in a uint8 view.
  pubKey = new Uint8Array(pubKey);

  // Useful for visualisations.
  let pemKey = await importRsaPublicKey(pubKey, 'raw');
  pemKey = await exportRsaPublicKey({ publicKey: pemKey }, 'pem');

  const dialog = $modal.alert({
    header: 'Contact Invite',
    body: 'Loading invite...',
    hideStackCounter: true,
  });

  dialog.onDimmerClick = () => {
    // Prevent accidentally closing invitations.
    const confirmation = $modal.confirm({
      header: 'Invite',
      body: 'Are you sure you want to reject the invite?',
      prioritise: true,
      hideStackCounter: true,
    }, (proceed) => {
      if (proceed) {
        $modal.deactivateModalById(confirmation.id);
        $modal.deactivateModalById(dialog.id);
      }
      else {
        $modal.deactivateModalById(confirmation.id);
      }
    });
  };

  return new Promise((resolve) => {
    // We create this after $modal.alert() so that we can safely pass in the
    // dialog options object.
    dialog.body = (
      <ReceiveInvitation
        dialog={dialog}
        source={source}
        ownName={ownName}
        greeting={greeting}
        pubKey={pubKey}
        pemKey={pemKey}
        time={time}
        onSelectChoice={(answer) => {
          resolve(answer);
        }}
      />
    );

    // Force the dialog to recognise the body change.
    $modal.invalidate();
  });
}

export {
  showAddContactDialog,
  showInvitationDialog,
};
