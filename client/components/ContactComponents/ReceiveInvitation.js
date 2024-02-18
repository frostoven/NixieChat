import React from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Segment } from 'semantic-ui-react';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { InvitationResponse } from '../../../shared/InvitationResponse';
import {
  EncryptedAccountStorage,
} from '../../storage/EncryptedAccountStorage';
import { NxField } from '../Generic/NxField';
import { RsaPreview } from '../Generic/RsaPreview';
import { RsvpResponseList } from './RsvpResponseList';
import { clientEmitter } from '../../emitters/comms';
import { clientEmitterAction } from '../../emitters/clientEmitterAction';
import { Invitation } from '../../api/Invitation';

const accountsStorage = new EncryptedAccountStorage();

/** @type React.CSSProperties */
const greetingStyle = {
  padding: 8,
  marginLeft: 8,
  marginRight: 16,
  marginTop: 4,
  border: 'thin dashed grey',
  borderLeft: '4px solid grey',
};

class ReceiveInvitation extends React.Component {
  static propTypes = {
    creatorId: PropTypes.string,
    floatingForm: PropTypes.object.isRequired,
    onSelectChoice: PropTypes.func,
  };

  static defaultProps = {
    onSelectChoice: () => {
    },
  };

  state = {
    greetingName: '',
    greetingMessage: '',
    waitingForConfirmation: false,
    invitationInfo: null,
  };

  constructor(props) {
    super(props);
    this.floatingForm = props.floatingForm;
    this.setupDialog(props.floatingForm);
  }

  componentDidMount() {
    clientEmitter.on(
      clientEmitterAction.updateContactCreatorViews, this.updateContactCreatorViews,
    );
    this.rebuild();
  }

  /** @param {InvitationInfo} info */
  updateContactCreatorViews = (info) => {
    if (this.props.creatorId === info.id) {
      this.rebuild();
    }
  };

  rebuild = () => {
    const invitationInfo = Invitation.getInfoById(this.props.creatorId);
    const newState = { invitationInfo };

    if (!this.state.greetingName) {
      newState.greetingName = this.getGreetingName(invitationInfo);
    }

    this.setState(newState);
  };

  // All these buttons are disabled at first to give the user time to respond
  // to read the request.
  actions = [
    {
      name: 'Reject Invite',
      onSelect: () => {
        $dialog.confirm({
          prioritise: true,
          header: 'Reject Invite',
          body: 'Are you sure you want to reject this contact? They will ' +
            'not be informed that you have rejected their invite.',
        }, (confirmedBlock) => {
          if (confirmedBlock) {
            $floatingForm.deactivateModalById(this.floatingForm.id);
            this.props.onSelectChoice({ answer: InvitationResponse.reject });
          }
        });
      },
      disabled: true,
    },
    {
      name: 'Block Account',
      onSelect: () => {
        $dialog.confirm({
          prioritise: true,
          header: 'Permanent Block',
          body: 'Are you sure you want to block this contact? They will not ' +
            'be informed that you have blocked them.',
        }, (confirmedBlock) => {
          if (confirmedBlock) {
            $floatingForm.deactivateModalById(this.floatingForm.id);
            console.warn('TODO: block RSA key.');
            this.props.onSelectChoice({ answer: InvitationResponse.block });
          }
        });
      },
      disabled: true,
    },
    {
      name: 'Ask Me Later',
      onSelect: () => {
        $dialog.confirm({
          prioritise: true,
          header: 'Postpone',
          body: (
            <div>
              The person who sent the invite will be informed that you wish for
              them to send you another invite at a later time.
              <br/><br/>
              Proceed?
            </div>
          ),
        }, (confirmedPostpone) => {
          if (confirmedPostpone) {
            $floatingForm.deactivateModalById(this.floatingForm.id);
            this.props.onSelectChoice({ answer: InvitationResponse.postpone });
          }
        });
      },
      disabled: true,
    },
    {
      name: 'Accept Invite',
      onSelect: () => {
        this.props.onSelectChoice({
          answer: InvitationResponse.accept,
          greetingName: this.state.greetingName,
          greetingMessage: this.state.greetingMessage,
        });
        this.setState({
          waitingForConfirmation: true,
        });

        this.props.floatingForm.actions = [];
        $floatingForm.invalidate();
      },
      disabled: true,
      style: { marginLeft: 16 },
    },
  ];

  setupDialog = (floatingForm) => {
    floatingForm.actions = [
      ...this.actions,
      <Button key="invite" disabled
              style={{ position: 'absolute', left: 4 }}>
        <i>Options available in 3 seconds</i>
      </Button>,
    ];

    // Force modal to recognize button changes.
    $floatingForm.invalidate();

    // Wait 3 seconds, then make the buttons clickable. We wait to ensure the
    // user doesn't accidentally click any buttons while using the app.
    setTimeout(() => {
      this.actions.forEach((action) => {
        action.disabled = false;
      });
      floatingForm.actions = this.actions;
      $floatingForm.invalidate();
    }, 3);
  };

  /**
   * @param {InvitationInfo} info
   * @return {string}
   */
  getGreetingName = (info) => {
    if (!info) {
      return '';
    }

    let replyingAccount = accountsStorage.findAccountById({
      id: info.localAccountId,
    });

    if (replyingAccount.decryptedData.publicName) {
      return replyingAccount.decryptedData.publicName;
    }
    else {
      return replyingAccount.decryptedData.personalName;
    }
  };

  closeModal = () => {
    $floatingForm.deactivateModalById(this.floatingForm.id);
  };

  render() {
    if (!this.state.invitationInfo) {
      return 'Invitation no longer valid.';
    }

    /** @type InvitationInfo */
    const info = this.state.invitationInfo;
    const {
      greetingName, greetingMessage, waitingForConfirmation,
    } = this.state;
    const darkMode = Settings.isDarkModeEnabled();

    const {
      time,
      localPublicName,
      contactGreetingName,
      contactGreetingMessage,
      contactPubKey,
      contactPemKey,
      localPubKey,
      localPemKey,
    } = info;

    if (this.state.waitingForConfirmation) {
      return (
        <RsvpResponseList
          key={`RsvpResponseList-${this.props.creatorId}`}
          overrideLoaderMessage={'Waiting for confirmation...'}
          invitationIds={[ info.id ]}
          onContactAdded={this.closeModal}
        />
      );
    }

    return (
      <div>
        You have received a contact invite from someone claiming to be
        "{contactGreetingName}". This request was sent to "{localPublicName}".
        <br/><br/>
        If you are not expecting an invitation, it is highly advisable you
        decline this request. Only accept contacts you trust; they can resend
        the invitation at any time (unless you block them).
        <br/><br/>

        {
          contactGreetingMessage && (
            <div>
              They've included this greeting:
              <p style={greetingStyle}>
                {contactGreetingMessage}
              </p>
            </div>
          )
        }

        <Segment inverted={!darkMode}>
          <Form>
            <NxField
              label="Name shown if you accept"
              help={
                <div>
                  The name displayed if you accept their invite.
                  <br/><br/>
                  Names and greetings are not shown to the other person if
                  you
                  reject, block, or postpone the invite.
                </div>
              }
              autoFocus
              value={greetingName}
              onChange={(event) => {
                this.setState({ greetingName: event.target.value });
              }}
            />

            <NxField
              label="Greeting shown if you accept"
              help={
                <div>
                  Message to send back before confirming adding as contact.
                  <br/>
                  <b>Note:</b> Greetings are not encrypted.
                </div>
              }
              value={greetingMessage}
              onChange={(event) => {
                this.setState({ greetingMessage: event.target.value });
              }}
            />
          </Form>
        </Segment>
        <RsaPreview
          contactPubKey={contactPubKey} contactPemKey={contactPemKey}
          localPubKey={localPubKey} localPemKey={localPemKey}
          contactName={contactGreetingName}
        />
      </div>
    );
  }
}

export {
  ReceiveInvitation,
};
