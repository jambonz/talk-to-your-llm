# talk-to-your-llm

This is a basic voicebot connected to using their Assistant framework.

## Installing

The basics:
```bash
npm ci
WS_PORT=3000 OPENAI_API_KEY=xxxx node app.js
```

In the jambonz webapp create an application with url `wss://<your-domain>/llm-voicebot` and route calls to it.

## Environment variables

|variable|meaning|required|
|---------|------|--------|
|OPENAI_API_KEY|Your api key|yes|
|OPENAI_MODEL|model to use|no (default: gpt-4-turbo)|
|BOT_NAME|Name of Assistant to create|no (default: jambonz-llm-voicebot)|

## Limitations

Currently, there is no support for adding [Tools](https://platform.openai.com/docs/assistants/tools) to the Assistant.  User input is transcribed as presented as simple text and the OpenAI assistant is encouraged (via system instructions) to respond with text that is brief and un-annotated.