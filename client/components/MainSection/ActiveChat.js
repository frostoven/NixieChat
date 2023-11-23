import React from 'react';

const chatBackgroundStyle = {
  // Generated using https://mycolor.space/gradient3?ori=to+right+bottom&hex=%23DBDDBB&hex2=%2388B884&hex3=%23D5D88D&submit=submit
  backgroundImage: 'linear-gradient(to right bottom, #dbddbb, #ced6af, #c0cfa3, #b0c898, #a0c18f, #9ec18c, #9cc188, #9ac185, #a8c786, #b7cd88, #c6d38a, #d5d88d)',
};

const chatForegroundStyle = {
  height: '100%',
  backgroundImage: 'url(/assets/backgrounds/defaultPattern.svg)',
  backgroundSize: 392,
  opacity: 0.2,
};

const chatTextAreaStyle = {
  position: 'absolute',
  top: 0, bottom: 0, left: 0, right: 0,
  padding: 8,
};

class ActiveChat extends React.Component {
  render() {
    return (
      <>
        <div style={chatBackgroundStyle}>
          <div style={chatForegroundStyle}>
          </div>
        </div>
        <div style={chatTextAreaStyle}>
          // active chat
        </div>
      </>
    );
  }
}

export {
  ActiveChat,
};
