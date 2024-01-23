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

/**
 * @param {ContactCreatorStats} stats
 * @return {Promise}
 */
async function showInvitationDialog(stats) {
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
        creatorId={stats.id}
        dialog={dialog}
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
