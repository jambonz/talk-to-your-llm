
const OpenAIAssistant = require('../utils/ai-assistants/llm-openai');
const {system_instructions} = require('../../data/settings.json');
const {processStreamingResponse, streamingResponseComplete} = require('../utils/process-streaming-response');

const service = ({logger, makeService}) => {
  const assistant = new OpenAIAssistant({
    logger,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
    name: process.env.BOT_NAME || 'jambonz-llm-voicebot',
    instructions: system_instructions
  });
  assistant.init();

  const svc = makeService({path: '/llm-voicebot'});

  svc.on('session:new', (session, path) => {
    session.locals = { ...session.locals,
      logger: logger.child({call_sid: session.call_sid}),
      deepgramOptions: {
        endpointing: 350,
        utteranceEndMs: 1000,
      },
      turns: 0,
      says: 0,
      textOffset: 0,
      assistant
    };
    session.locals.logger.info({session, path}, `new incoming call: ${session.call_sid}`);

    session
      .on('/user-input-event', onUserInputEvent.bind(null, session))
      .on('close', onClose.bind(null, session))
      .on('error', onError.bind(null, session));

    session
      .answer()
      .pause({length: 0.5})
      .config({
        recognizer: {
          vendor: 'default',
          language: 'default',
          deepgramOptions: session.locals.deepgramOptions
        },
        bargeIn: {
          enable: true,
          input: ['speech'],
          actionHook: '/user-input-event',
          sticky: true,
        }
      })
      .say({text: 'Hi there!  You are speaking to chat GPT.  What would you like to know?'})
      .reply();
  });
};

const onUserInputEvent = async(session, evt) => {
  const {logger} = session.locals;
  logger.info({evt}, 'got speech evt');

  switch (evt.reason) {
    case 'speechDetected':
      handleUserUtterance(session, evt);
      break;
    case 'timeout':
      break;
    default:
      session.reply();
      break;
  }

};

const handleUserUtterance = async(session, evt) => {
  const {logger, assistant, thread} = session.locals;
  const {speech} = evt;
  const userMessage = speech.alternatives[0].transcript;
  logger.info({utterance: speech.alternatives[0]}, 'handling user utterance');

  if (!thread) {
    const thread = await assistant.createThread(userMessage);
    thread
      .on('botStreamingResponse', (response) => {
        processStreamingResponse(session, response);
      })
      .on('botStreamingCompleted', () => {
        streamingResponseComplete(session);
      });
    session.locals.thread = thread;
  }
  else {
    thread.addUserMessage(speech.alternatives[0].transcript);
  }
  session.reply();
};

const onClose = (session) => {
  const {logger, thread} = session.locals;
  logger.info('call ended');
  if (thread) {
    thread.close();
  }
};

const onError = (session, err) => {
  const {logger} = session.locals;
  logger.error(err, 'Error in call');
};

module.exports = service;
