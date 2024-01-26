import React from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Segment } from 'semantic-ui-react';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { InvitationResponse } from '../../../shared/InvitationResponse';
import { Accounts } from '../../storage/cacheFrontends/Accounts';
import { NxField } from '../Generic/NxField';
import { RsaPreview } from '../Generic/RsaPreview';
import { RsvpResponseList } from './RsvpResponseList';
import { clientEmitter } from '../../emitters/comms';
import { clientEmitterAction } from '../../emitters/clientEmitterAction';
import { ContactCreator } from '../../api/ContactCreator';

class ReceiveInvitation extends React.Component {
  static propTypes = {
    creatorId: PropTypes.string,
    dialog: PropTypes.object.isRequired,
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
    contactStats: null,
  };

  constructor(props) {
    super(props);
    this.dialog = props.dialog;
    this.setupDialog(props.dialog);
  }

  componentDidMount() {
    clientEmitter.on(
      clientEmitterAction.updateContactCreatorViews, this.updateContactCreatorViews,
    );
    this.rebuild();
  }

  /** @param {ContactCreatorStats} stats */
  updateContactCreatorViews = (stats) => {
    if (this.props.creatorId === stats.id) {
      this.rebuild();
    }
  };

  rebuild = () => {
    const contactStats = ContactCreator.getStatsById(this.props.creatorId);
    const newState = { contactStats };

    if (!this.state.greetingName) {
      newState.greetingName = this.getGreetingName(contactStats);
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
            $dialog.deactivateModalById(this.dialog.id);
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
            $dialog.deactivateModalById(this.dialog.id);
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
            $dialog.deactivateModalById(this.dialog.id);
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

        this.props.dialog.actions = [];
        $dialog.invalidate();
      },
      disabled: true,
      style: { marginLeft: 16 },
    },
  ];

  setupDialog = (dialog) => {
    dialog.actions = [
      ...this.actions,
      <Button key="invite" disabled
              style={{ position: 'absolute', left: 4 }}>
        <i>Options available in 3 seconds</i>
      </Button>,
    ];

    // Force modal to recognize button changes.
    $dialog.invalidate();

    // Wait 3 seconds, then make the buttons clickable. We wait to ensure the
    // user doesn't accidentally click any buttons while using the app.
    setTimeout(() => {
      this.actions.forEach((action) => {
        action.disabled = false;
      });
      dialog.actions = this.actions;
      $dialog.invalidate();
    }, 3);
  };

  /**
   * @param {ContactCreatorStats} stats
   * @return {string}
   */
  getGreetingName = (stats) => {
    if (!stats) {
      return '';
    }

    let replyingAccount = Accounts.findAccountById({
      id: stats.localAccountId,
    });

    if (replyingAccount.publicName) {
      return replyingAccount.publicName;
    }
    else {
      return replyingAccount.personalName;
    }
  };

  render() {
    console.log('rendering ReceiveInvitation');
    if (!this.state.contactStats) {
      return 'Invitation no longer valid.';
    }

    /** @type ContactCreatorStats */
    const stats = this.state.contactStats;
    const {
      greetingName, greetingMessage, waitingForConfirmation,
    } = this.state;
    const darkMode = Settings.isDarkModeEnabled();

    const {
      time,
      localPublicName,
      contactGreetingName,
      contactPubKey,
      contactPemKey,
    } = stats;

    if (this.state.waitingForConfirmation) {
      return (
        <RsvpResponseList
          key={`RsvpResponseList-${this.props.creatorId}`}
          overrideLoaderMessage={'Waiting for confirmation...'}
          invitationIds={[ stats.id ]}
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
        <RsaPreview pubKey={contactPubKey} pemKey={contactPemKey}/>
      </div>
    );
  }
}

export {
  ReceiveInvitation,
};
