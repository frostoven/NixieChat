// Represents a message in decrypted form.
class Message {
  // Counts from zero up after app boot. Should be treated as random. The
  // runtimeId is ephemeral, don't rely on it.
  runtimeId: number | undefined;
  // If true, the message originated from this device. Otherwise, someone sent
  // it to us.
  isLocal: boolean | undefined;
  // The formatted text the user sees.
  body: any;
  // If true, the message has since been modified.
  edited: boolean | undefined;
  // Message construction time.
  time: number | undefined;
  // If set, contains the message ID of the message being replied to.
  replyTo: string | undefined;
  // Optional; text quoted from original reply. Does not take edits into
  // account.
  replyQuote: string | undefined;
  // If true, we format text when displayed.
  isMarkdown: boolean | undefined;
  // If true, the bubble in question should be allowed to stretch to fit line
  // contents.
  containsCode: boolean | undefined;

  // Dumps the message data with abbreviated keys.
  dumpCompacted() {
    // b=body, e=edited, r=replyTo, q=replyQuote, [tbd].
  }
}

export {
  Message,
};
