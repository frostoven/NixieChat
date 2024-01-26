import React from 'react';
import { ContactFinder } from '../components/ContactComponents/ContactFinder';
import { exportRsaPublicKey, importRsaPublicKey } from '../encryption/rsa';
import {
  ReceiveInvitation,
} from '../components/ContactComponents/ReceiveInvitation';

function showAddContactDialog() {
  $dialog.alert({
    header: 'Add contact',
    body: <ContactFinder/>,
    actions: [],
  });
}

/**
 * @param {ContactCreatorStats} stats
 * @return {Promise}
 */
async function showInvitationDialog(stats) {
  const dialog = $dialog.alert({
    header: 'Contact Invite',
    body: 'Loading invite...',
    hideStackCounter: true,
  });

  dialog.onDimmerClick = () => {
    // Prevent accidentally closing invitations.
    const confirmation = $dialog.confirm({
      header: 'Invite',
      body: 'Are you sure you want to reject the invite?',
      prioritise: true,
      hideStackCounter: true,
    }, (proceed) => {
      if (proceed) {
        $dialog.deactivateModalById(confirmation.id);
        $dialog.deactivateModalById(dialog.id);
      }
      else {
        $dialog.deactivateModalById(confirmation.id);
      }
    });
  };

  return new Promise((resolve) => {
    // We create this after $dialog.alert() so that we can safely pass in the
    // dialog options object.
    dialog.body = (
      <ReceiveInvitation
        creatorId={stats.id}
        dialog={dialog}
        onSelectChoice={(answer) => {
          resolve(answer);
        }}
      />
    );

    // Force the dialog to recognise the body change.
    $dialog.invalidate();
  });
}

export {
  showAddContactDialog,
  showInvitationDialog,
};
