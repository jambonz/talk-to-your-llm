
const processStreamingResponse = async(session, text) => {
  const {logger, says, textOffset} = session.locals;
  let spoken = false;

  /* trim the leading part of the text we have already said */
  const trimmed = text.substring(textOffset);

  /**
   * when we have a new response, say the first sentence as soon as available to get it out,
   * after that fall back to speaking the rest of the response in chunks of paragraphs
   */

  if (says === 0) {
    const pos = trimmed.indexOf('.');
    if (-1 !== pos) {
      const firstSentence = trimmed.substring(0, pos + 1);
      logger.info(`speaking first sentence: ${firstSentence}`);
      session
        .say({text: firstSentence})
        .send({execImmediate: true});
      session.locals.says++;
      session.locals.textOffset = pos + 1;
      spoken = true;
      session.locals.unsent = trimmed.substring(pos + 1);
    }
  }
  if (says > 0) {
    const pos = trimmed.indexOf('\n\n');
    if (-1 !== pos) {
      const paragraph = trimmed.substring(0, pos);
      logger.info(`speaking paragraph: ${paragraph}`);
      session
        .say({text: paragraph})
        .send({execImmediate: false});
      session.locals.says++;
      session.locals.textOffset += (pos + 2);
      spoken = true;
      session.locals.unsent = trimmed.substring(pos + 2);
    }
  }

  if (!spoken) {
    session.locals.unsent = trimmed;
  }
};

const streamingResponseComplete = async(session) => {
  const {logger, unsent} = session.locals;

  if (unsent) {
    logger.info('sending final unsent text');
    session
      .say({text: unsent})
      .send({execImmediate: false});
  }
  session.locals.turns++;
  session.locals.says = 0;
  session.locals.textOffset = 0;
  session.locals.unsent = '';
};

module.exports = {
  processStreamingResponse,
  streamingResponseComplete
};
