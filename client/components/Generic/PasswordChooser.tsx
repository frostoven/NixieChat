import React from 'react';
import { NxField } from '../Generic/NxField';
import {
  Button,
  Form,
  Header,
  Icon,
  Message,
  Segment,
} from 'semantic-ui-react';
import { Settings } from '../../storage/cacheFrontends/Settings';
import { AutoKeyMap } from '../../events/AutoKeyMap';

const capsLockWarnStyle: React.CSSProperties = {
  padding: 10,
  paddingLeft: 19,
  color: '#000',
};

interface Props {
  header: JSX.Element | string,
  body: JSX.Element | string,
  onChoosePassword: Function,
}

class PasswordChooser extends React.Component<Props> {
  autoKeyMap = new AutoKeyMap();
  state = {
    password: '',
    confirmPassword: '',
    error: '',
  };

  componentDidMount() {
    this.autoKeyMap.bindKeys({
      Enter: this.handleSubmit,
      Escape: this.handleClear,
    });
  }

  componentWillUnmount() {
    this.autoKeyMap.destroy();
  }

  handleSubmit = () => {
    if (this.state.password !== this.state.confirmPassword) {
      return this.setState({
        error: 'Passwords do not match.',
      });
    }

    this.props.onChoosePassword(this.state.password);
  };

  handleClear = () => {
    this.setState({
      password: '',
      error: '',
    });
  };

  render() {
    console.log('Caps state:', AutoKeyMap.capsLockOn);
    const { header, body } = this.props;
    const { password, confirmPassword, error } = this.state;
    const darkMode = Settings.isDarkModeEnabled();
    return (
      <Segment style={{ textAlign: 'left' }} inverted={!darkMode}>
        <Header>{header}</Header>
        {body}

        <Form>
          <NxField
            label="Password (leave empty to skip)"
            help={
              'This will encrypt your contacts list, account info, and chat ' +
              'passwords.'
            }
            autoFocus
            placeholder={'Optional Password'}
            value={password}
            isPassword={true}
            onChange={(event: { target: { value: string; }; }) => {
              this.setState({ password: event.target.value });
            }}
          />

          <NxField
            label="Confirm Password"
            visible={!!password}
            placeholder={'Confirm Password'}
            value={confirmPassword}
            isPassword={true}
            onChange={(event: { target: { value: string; }; }) => {
              this.setState({ confirmPassword: event.target.value });
            }}
          />

          {AutoKeyMap.capsLockOn &&
            <Message color="yellow" style={capsLockWarnStyle}>
              <i>Note: Caps Lock is on</i>
            </Message>}

          {error && <Message>{error}</Message>}

          <Button
            icon
            color="green"
            type="button"
            labelPosition="left"
            onClick={this.handleSubmit}
          >
            <Icon name="key"/>
            Continue
          </Button>
        </Form>

      </Segment>
    );
  }
}

export {
  PasswordChooser,
};
