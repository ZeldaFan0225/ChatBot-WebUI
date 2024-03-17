# ChatBot WebUI

THIS PROJECT IS UNDER ACTIVE DEVELOPMENT AND DOES NOT ACCEPT CONTRIBUTIONS AT THE CURRENT TIME

This ChatBot WebUI is a web application designed to work with any LLM API.  

## Features

- Communicate with any LLM API (Like OpenAI Chat API, Anthropic Claude API, Google Gemini API, ...)
- Change provider mid conversation
- Apply overrides to model configurations at any point in the conversation
- Attach images to be used with compatible models
- Export your chat as json
- Resume where you left. Overrides and your conversation is saved

## How to create a model configuration

### If your API is compatible with OpenAI format

- Add `OpenAiCompatibleConnector` to your connectors with the path `classes/connectors/OpenAiConnector` to the available connectors
- Add a new model configuration with `OpenAiCompatibleConnector` as your connector

### When using Anthropic's Rest API

- Add `AnthropicConnector` to your connectors with the path `classes/connectors/AnthropicConnector` to the available connectors
- Add a new model configuration with `AnthropicConnector` as your connector

### When using any other Rest API format

- Create a new connector by default exporting a class that extends the `BaseConnector` implementing all avaialble methods and properties
- Add `YourConnector` to your connectors with the path `classes/connectors/YourConnector` to the available connectors
- Add a new model configuration with `YourConnector` as your connector

## Access control

In the current state your can set a username and a password to restrict access to your instance.
When no password or username are set anyone can access and interact with your instance.

## How to set up

### Requirements

- [NodeJS](https://nodejs.org/en/download/) >= 18.17  

### Setup

1) Download the code from this repository  
2) Install the node modules using `npm i` (make sure the dev dependencies are also installed for typescript to work)  
3) Remove the `template.` from the `template.config.json` file  
4) Fill out the `template.env` and rename it to `.env`  
5) modify the [config.json](https://github.com/ZeldaFan0225/ChatBot-WebUI/blob/main/template.config.json) file (from step 3) to fit your needs
6) compile the code and start the process (this can be done by using `npm run deploy`)  
  
Now if everything is set up it should start and give an output in the console.  

## Contributing

To contribute simply create a pull request or [open an Issue](https://github.com/ZeldaFan0225/ChatGPT-Discord-Bot/issues/new).  
The addition of new connectors and improvements are always welcome.

## Support

For support [open an Issue](https://github.com/ZeldaFan0225/ChatGPT-Discord-Bot/issues/new).