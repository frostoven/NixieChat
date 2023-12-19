import React from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Segment } from 'semantic-ui-react';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { InvitationResponse } from '../../../shared/InvitationResponse';
import { Accounts } from '../../storage/cacheFrontends/Accounts';
import { NxField } from '../Generic/NxField';
import { RsaPreview } from '../Generic/RsaPreview';

class ReceiveInvitation extends React.Component {
  static propTypes = {
    dialog: PropTypes.object.isRequired,
    source: PropTypes.string.isRequired,
    ownName: PropTypes.string.isRequired,
    greeting: PropTypes.string.isRequired,
    pubKey: PropTypes.any.isRequired,
    time: PropTypes.number.isRequired,
    onSelectChoice: PropTypes.func,
  };

  static defaultProps = {
    onSelectChoice: () => {
    },
  };

  constructor(props) {
    super(props);

    this.dialog = props.dialog;
    this.setupDialog(props.dialog);
  }

  state = {
    greetingName: '',
    greetingMessage: '',
  };

  // All these buttons are disabled at first to give the user time to respond
  // to
  actions = [
    {
      name: 'Reject Invite',
      onSelect: () => {
        $modal.confirm({
          prioritise: true,
          header: 'Reject Invite',
          body: 'Are you sure you want to reject this contact? They will ' +
            'not be informed that you have rejected their invite.',
        }, (confirmedBlock) => {
          if (confirmedBlock) {
            $modal.deactivateModalById(this.dialog.id);
            this.props.onSelectChoice({ answer: InvitationResponse.reject });
          }
        });
      },
      disabled: true,
    },
    {
      name: 'Block Account',
      onSelect: () => {
        $modal.confirm({
          prioritise: true,
          header: 'Permanent Block',
          body: 'Are you sure you want to block this contact? They will not ' +
            'be informed that you have blocked them.',
        }, (confirmedBlock) => {
          if (confirmedBlock) {
            $modal.deactivateModalById(this.dialog.id);
            console.log('TODO: block RSA key.');
            this.props.onSelectChoice({ answer: InvitationResponse.block });
          }
        });
      },
      disabled: true,
    },
    {
      name: 'Ask Me Later',
      onSelect: () => {
        $modal.confirm({
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
            $modal.deactivateModalById(this.dialog.id);
            this.props.onSelectChoice({ answer: InvitationResponse.postpone });
          }
        });
      },
      disabled: true,
    },
    {
      name: 'Accept Invite',
      onSelect: () => {
        $modal.deactivateModalById(this.dialog.id);
        this.props.onSelectChoice({
          answer: InvitationResponse.accept,
          greetingName: this.state.greetingName,
          greetingMessage: this.state.greetingMessage,
        });
      },
      disabled: true,
      style: { marginLeft: 16 },
    },
  ];

  componentDidMount() {
    this.setupPersonalName();
  }

  setupDialog = (dialog) => {
    dialog.actions = [
      ...this.actions,
      <Button key="invite" disabled
              style={{ position: 'absolute', left: 4 }}>
        <i>Options available in 3 seconds</i>
      </Button>,
    ];

    // Force modal to recognize button changes.
    $modal.invalidate();

    // Wait 3 seconds, then make the buttons clickable. We wait to ensure the
    // user doesn't accidentally click any buttons while using the app.
    setTimeout(() => {
      this.actions.forEach((action) => {
        action.disabled = false;
      });
      dialog.actions = this.actions;
      $modal.invalidate();
    }, 3000);
  };

  setupPersonalName = () => {
    const { ownName } = this.props;

    let replyingAccount = Accounts.findAccountByPublicName({
      publicName: ownName,
    });

    console.log('=> replyingAccount:', replyingAccount);

    if (replyingAccount === null) {
      this.setState({ greetingName: ownName });
    }
    else {
      this.setState({ greetingName: replyingAccount.personalName });
    }
  };

  render() {
    const { greetingName, greetingMessage } = this.state;
    const { source, ownName, pubKey, pemKey } = this.props;
    const darkMode = Settings.isDarkModeEnabled();

    return (
      <div>
        You have received a contact invite from someone claiming to be
        "{source}". This request was sent to "{ownName}".
        <br/><br/>
        If you are not expecting an invitation, it is highly advisable you
        decline this request. Only accept contacts you trust; they can resend
        the invitation at any time (unless you block them).
        <br/><br/>
        This invite expires in 120 seconds.

        <Segment inverted={!darkMode}>
          <Form>
            <NxField
              label="Name shown if you accept"
              help={
                <div>
                  The name displayed if you accept their invite.
                  <br/><br/>
                  Names and greetings are not shown to the other person if you
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
              autoFocus
              value={greetingMessage}
              onChange={(event) => {
                this.setState({ greetingMessage: event.target.value });
              }}
            />
          </Form>
        </Segment>
        <RsaPreview pubKey={pubKey} pemKey={pemKey}/>
      </div>
    );
  }
}

export {
  ReceiveInvitation,
};
