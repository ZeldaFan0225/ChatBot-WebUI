import { BaseChatMessage } from "./classes/BaseConnector";


/* Types for Configuration */

export interface Config {
    model_configurations: Record<string, ModelConfiguration>;
    connectors: Record<string, string>;
}

export interface ModelConfiguration {
    connector: string;
    connectorOptions: Record<string, any>;
}


/* API Interface Types */

export interface ChatCompletionRequest {
    model: string;
    messages: BaseChatMessage[];
}