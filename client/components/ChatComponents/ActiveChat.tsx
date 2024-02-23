import React from 'react';
import PropTypes from 'prop-types';
import { Settings } from '../../storage/cacheFrontends/Settings';
import {
  EncryptedAccountStorage,
} from '../../storage/EncryptedAccountStorage';
import { ChatBox } from './ChatBox';
import { Message } from '../../storage/EncryptedChat/Message';
import { ChatBubble } from './ChatBubble';

const accountStorage = new EncryptedAccountStorage();

const BATCH_SIZE_LIMIT = 37;

const chatBgStyle = {
  // Generated using https://mycolor.space/gradient3?ori=to+right+bottom&hex=%23DBDDBB&hex2=%2388B884&hex3=%23D5D88D&submit=submit
  backgroundImage: 'linear-gradient(to right bottom, #dbddbb, #ced6af, #c0cfa3, #b0c898, #a0c18f, #9ec18c, #9cc188, #9ac185, #a8c786, #b7cd88, #c6d38a, #d5d88d)',
};

const chatBgStyleInverted = {
  backgroundImage: 'revert',
};

const chatFgStyle: React.CSSProperties = {
  height: '100%',
  backgroundImage: 'url(/assets/backgrounds/defaultPattern.svg)',
  backgroundSize: 392,
  opacity: 0.2,
};

const chatContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0, bottom: 0, left: 0, right: 0,
  paddingBottom: 12,
};

const chatAreaStyle: React.CSSProperties = {
  position: 'relative',
  height: '100%',
};

const scrollableStyle: React.CSSProperties = {
  position: 'absolute',
  overflowX: 'hidden',
  overflowY: 'auto',
  top: 0,
  left: 0,
  bottom: 45,
  right: 15,
};

interface Props {
  accountName: string,
  messageDetachableId: string,
  onCloseChat: Function,
}

let bubbleCount = 0;

class ActiveChat extends React.Component<Props> {
  // The PropTypes package does compile-time checks, which is why use this as
  // well as a Props interface.
  static propTypes = {
    accountName: PropTypes.string.isRequired,
    messageDetachableId: PropTypes.string.isRequired,
    onCloseChat: PropTypes.func.isRequired,
  };

  scrollRef: React.RefObject<any> = React.createRef();

  // This contains the latest conversation. This is filled as messages
  // arrive. However, when a DB is read for old messages, they're ordered by
  // time instead. This ensures the user doesn't miss delayed messages
  // (though perhaps make a different color [like red] if received really
  // late?). This also means we can efficiently update renders.
  //
  // Each batch is an array of 37 messages. That is, this is an array that
  // contains more arrays. They're done in batches so that we can easily remove
  // old messages from memory without excessive array manipulation.
  //
  // It's a little anti-React, but we don't store this in state because it
  // would require rebuilding a really massive array with every tiny change,
  // which seriously harms performance. Instead, we directly manipulate this
  // array and update visuals with forceUpdate (where child components may then
  // be optimized via shouldComponentUpdate()).
  private messageBatches: Message[][] = [];

  // === Note: Does not yet send messages. === //
  onSendMessage = (plaintext: string) => {
    const message = new Message();
    message.time = Date.now();
    // TODO: Add markdown processor.
    message.body = plaintext;
    message.runtimeId = ++bubbleCount;

    // As we're still in dev mode, randomly choose who the message originated
    // from.
    message.isLocal = Math.random() < 0.5;

    this.stackMessage(message);

    this.forceUpdate(() => {
      const ref = this.scrollRef.current;
      if (ref) {
        // Scroll to bottom after sending a message.
        ref.scrollTop = ref.scrollHeight;
      }
    });
  };

  // Add a message to the list of renderable components, but does not trigger
  // a render.
  stackMessage = (message: Message) => {
    const messageBatches = this.messageBatches;
    if (!messageBatches.length) {
      messageBatches.push([ message ]);
    }
    else {
      const lastBatch = messageBatches[messageBatches.length - 1];
      if (lastBatch.length < BATCH_SIZE_LIMIT) {
        lastBatch.push(message);
      }
      else {
        messageBatches.push([ message ]);
      }
    }
  };

  genChat = () => {
    const { accountName, messageDetachableId, onCloseChat } = this.props;
    if (!messageDetachableId) {
      return null;
    }

    const chatCache = accountStorage.getMessages({
      messageDetachableId,
      count: 37,
    });

    return (
      <>
        <ChatBox
          accountName={accountName}
          messageDetachableId={messageDetachableId}
          onSendMessage={this.onSendMessage}
          onCloseChat={onCloseChat}
        />
      </>
    );
  };

  render() {
    const darkMode = Settings.isDarkModeEnabled();
    const bgStyle = darkMode ? chatBgStyleInverted : chatBgStyle;
    return (
      <>
        <div style={bgStyle}>
          <div style={chatFgStyle}/>
        </div>
        <div style={chatContainerStyle}>
          <div style={chatAreaStyle}>
            <div ref={this.scrollRef} style={scrollableStyle}>
              {this.messageBatches.map((batch) => {
                // This structure ensures that each bubble can selectively
                // choose when to render via shouldComponentUpdate.
                return batch.map((message: Message) => {
                  return <ChatBubble
                    bubbleId={message.runtimeId!}
                    key={`bubble-${message.runtimeId}`}
                    message={message}
                  />;
                });
              })}
            </div>
            {this.genChat()}
          </div>
        </div>
      </>
    );
  }
}

export {
  ActiveChat,
};
