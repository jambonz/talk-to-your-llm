# talk-to-your-llm

This is a basic voicebot connected to OpenAI and using their Assistant framework to drive a voice conversation with the LLM.

## Installing

The basics:
```bash
npm ci
WS_PORT=3000 OPENAI_API_KEY=xxxx node app.js
```

In the jambonz webapp create an application with url `wss://<your-domain>/llm-voicebot` and route calls to it.

## Configuration

|Environment variable|meaning|required|
|---------|------|--------|
|OPENAI_API_KEY|Your api key|yes|
|OPENAI_MODEL|model to use|no (default: gpt-4-turbo)|
|BOT_NAME|Name of Assistant to create|no (default: jambonz-llm-voicebot)|

If you want to change the system instruction edit [./data/settings.json](./data/settings.json)

## Limitations

Currently, there is no support for adding [Tools](https://platform.openai.com/docs/assistants/tools) to the Assistant.  User input is transcribed and then presented to the OpenAI Assistant as simple text, and the OpenAI assistant is encouraged (via system instructions) to respond with text that is brief and un-annotated.