import React from 'react';
import PropTypes from 'prop-types';
import { InvitationResponse } from '../../../shared/InvitiationResponse';
import { Button, Form, Header, Icon, List, Loader } from 'semantic-ui-react';
import { Settings } from '../../storage/cacheFrontends/Settings';

/** @type React.CSSProperties */
const columnStyle = {
  display: 'inline-block',
  height: '100%',
  verticalAlign: 'top',
  overflow: 'auto',
};

/** @type React.CSSProperties */
const leftColStyle = {
  ...columnStyle,
  paddingRight: 16,
  flex: '0 0 15em',
};

// /** @type React.CSSProperties */
// const rightColStyle = {
//   ...columnStyle,
//   paddingLeft: 16,
//   borderLeft: 'thin solid grey',
// };

/** @type React.CSSProperties */
const responseLoaderAnimation = {
  overflow: 'hidden',
};


/** @type React.CSSProperties */
const loaderIconStyle = {
  paddingLeft: 24,
  paddingBottom: 18,
};

/** @type React.CSSProperties */
const headerStyle = {
  textDecoration: 'underline',
};

/** @type React.CSSProperties */
const nameStyle = {
  cursor: 'pointer',
};

/** @type React.CSSProperties */
const selectedNameStyle = {
  ...nameStyle,
  fontWeight: 'bold',
};

class RsvpResponseList extends React.Component {
  static propTypes = {
    responses: PropTypes.array,
  };

  static defaultProps = {
    responses: [],
  };

  state = {
    selected: 0,
  };

  selectName = (index) => {
    this.setState({
      selected: index,
    });
  };

  startVerification = () => {
    //
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const { responses } = this.props;
    const { selected } = this.state;
    const leftSide = [
      <h3 key="ResponseHead">
        Responses
      </h3>,
    ];
    const rightSide = [];

    for (let i = 0, len = responses.length; i < len; i++) {
      const responseOptions = responses[i];
      const isSelected = selected === i;

      const {
        // response,
        sourceId,
        publicName,
        personalName,
        publicKey,
      } = responseOptions;

      const response = InvitationResponse.postpone;

      let name;
      if (personalName) {
        name = `${personalName} (${publicName})`;
      }
      else {
        name = publicName;
      }

      leftSide.push(
        <List key={`RsvpResponse${i}`} onClick={() => this.selectName(i)}>
          <List.Item>
            <List.Icon name="user circle"/>
            <List.Content>
              <List.Content style={isSelected ? selectedNameStyle : nameStyle}>
                {name}
              </List.Content>
            </List.Content>
          </List.Item>
        </List>,
      );

      //
      if (!isSelected) {
        // Only write to the right side if the selected name is active.
        continue;
      }

      // We only check for some response types because the client does not
      // always send a response. For example, we don't respond when blocking a
      // contact, because that would immediately tell the sender that the
      // person blocking them is online, which is a privacy issue.
      if (InvitationResponse.accept) {
        // An 8-char password with an (at-most) 14 color visual is something
        // of a joke compared to the actual massive text glob that DH
        // produces, but hey, any more complex than that and the layman just
        // won't bother. For the prudent, there's the SHA hash in the
        // advanced view.
        rightSide.push(
          <div key={`RsvpResponseAccepted${i}`}>
            <h3>Invitation to {publicName}</h3>
            <div>
              Contact has <b>accepted</b> your invitation.
              <br/><br/>
              Click 'Verify' to start the verification process. Please beware
              that this takes some time.
              {/*Please verify that the number and color below precisely match*/}
              {/*what your contact sees on their screen. Once confirmed, click*/}
              {/*'Confirm Verification.' Otherwise, this is not the correct person.*/}
              {/*<br/><br/>*/}
              <br/><br/>
              <Button style={{ float: 'right' }}>
                Verify
              </Button>
            </div>
          </div>,
        );
      }
      else if (InvitationResponse.postpone) {
        rightSide.push(
          <div key={`RsvpResponsePostponed${i}`}>
            <h3>Invitation to {publicName}</h3>
            <div>
              Contact has asked that you resend the invitation at another
              time.
              <br/><br/>
              Note that they have <b>not</b> declined your invitation.
            </div>
          </div>,
        );
      }
      else if (InvitationResponse.reject) {
        // Note: the client has the option to not send this, in which case
        // we'll simply time out.
        rightSide.push(
          <div key={`RsvpResponseRejected${i}`}>
            <h3>Invitation to {publicName}</h3>
            <div>
              Contact has declined your invitation.
            </div>
          </div>,
        );
      }
    }

    let loaderMessage;
    if (!responses.length) {
      loaderMessage = 'Waiting for replies...';
    }
    else {
    loaderMessage = 'Awaiting further replies...';
    }
    leftSide.push(
      <div key="ResponseLoaderAnimation" style={responseLoaderAnimation}>
        <Loader
          size="mini" active inline inverted={!darkMode}
          style={loaderIconStyle}
        /> {loaderMessage}
        <hr/>
      </div>,
    );

    return (
      <Form inverted={!darkMode}>
        <Form.Group widths="equal">
          <Form.Field style={leftColStyle}>
            {leftSide}
          </Form.Field>
          <Form.Field>
            {rightSide}
          </Form.Field>
        </Form.Group>
      </Form>
    );
  }
}

export {
  RsvpResponseList,
};
