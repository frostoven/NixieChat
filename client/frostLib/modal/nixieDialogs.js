import React from 'react';
import {
  ContactFinder,
} from '../../components/ContactComponents/ContactFinder';
import {
  ReceiveInvitation
} from '../../components/ContactComponents/ReceiveInvitation';

function showAddContactDialog(ownPublicName) {
  let header = 'Add Contact';
  if (ownPublicName) {
    // TODO: Allow disabling this in the settings.
    header += ' - ' + ownPublicName;
  }

  const contactAdder = $floatingForm.alert({
    header,
    body: <ContactFinder
      onContactAdded={() => {
        $floatingForm.deactivateModalById(contactAdder.id);
      }}
    />,
    actions: [],

    onDimmerClick: () => {
      const confirmation = $dialog.confirm({
        header: 'Finding Contacts',
        body: 'Are you sure you want to cancel the invitation process?',
        prioritise: true,
      }, (proceed) => {
        if (proceed) {
          $dialog.deactivateModalById(confirmation.id);
          $floatingForm.deactivateModalById(contactAdder.id);
        }
        else {
          $dialog.deactivateModalById(confirmation.id);
        }
      });
    },
  });
}

/**
 * @param {InvitationInfo} info
 * @return {Promise}
 */
async function showInvitationDialog(info) {
  const invite = $floatingForm.alert({
    header: 'Contact Invite',
    body: 'Loading invite...',
  });

  invite.onDimmerClick = () => {
    // Prevent accidentally closing invitations.
    const confirmation = $dialog.confirm({
      header: 'Invite',
      body: 'Are you sure you want to reject the invite?',
      prioritise: true,
    }, (proceed) => {
      if (proceed) {
        $dialog.deactivateModalById(confirmation.id);
        $floatingForm.deactivateModalById(invite.id);
      }
      else {
        $dialog.deactivateModalById(confirmation.id);
      }
    });
  };

  return new Promise((resolve) => {
    // We create this after $dialog.alert() so that we can safely pass in the
    // dialog options object.
    invite.body = (
      <ReceiveInvitation
        creatorId={info.id}
        floatingForm={invite}
        onSelectChoice={(answer) => {
          resolve(answer);
        }}
      />
    );

    // Force the dialog to recognise the body change.
    $floatingForm.invalidate();
  });
}

export {
  showAddContactDialog,
  showInvitationDialog,
};
