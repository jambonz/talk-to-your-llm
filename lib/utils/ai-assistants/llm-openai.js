const OpenAI = require('openai');
const openai = new OpenAI();
const Emitter = require('events');

/* TODO: in future, add support for other AI Assistants beyond OpenAI */
class OpenAIThread extends Emitter {
  constructor(logger, assistant_id, thread, run) {
    super();

    this.logger = logger;
    this.assistant_id = assistant_id;
    this.thread = thread;
    this.run = run;

    this._attachListeners();
  }

  _attachListeners() {
    this.run
      .on('event', (evt) => {
        if (evt.event === 'thread.run.completed') {
          this.emit('botStreamingCompleted');
        }
      })
      .on('textDelta', (delta, snapshot) => {
        this.emit('botStreamingResponse', snapshot.value);
      })
      .on('connect', () => this.logger.info('connected'))
      .on('end', () => this.logger.info('ended'));
  }

  async addUserMessage(userMessage) {
    this.logger.info('adding user message');
    await openai.beta.threads.messages.create(this.thread.id, {
      role: 'user',
      content: userMessage,
    });
    this.run = await openai.beta.threads.runs.stream(this.thread.id, {
      assistant_id: this.assistant_id
    });
    this._attachListeners();
  }

  async close() {
    await openai.beta.threads.del(this.thread.id);
  }
}

class OpenAIAssistant {
  constructor({logger, model, name, instructions}) {
    this.logger = logger;
    this.model = model;
    this.name = name;
    this.instructions = instructions;
  }

  async init() {
    try {
      this.assistant = await openai.beta.assistants.create({
        model: this.model,
        name: this.name,
        instructions: this.instructions,
      });
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  async createThread(initialUserMessage) {
    /* create a thread */
    try {
      this.logger.info({initialUserMessage}, `creating thread with message: ${initialUserMessage}`);
      const thread = await openai.beta.threads.create({
        messages: [
          {
            role: 'user',
            content: initialUserMessage,
          },
        ],
      });

      /* run the thread */
      this.logger.info('running thread');
      const run = await openai.beta.threads.runs.stream(thread.id, {
        assistant_id: this.assistant.id,
      });

      const t = new OpenAIThread(this.logger, this.assistant.id, thread, run);
      return t;
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }
}

module.exports = OpenAIAssistant;
