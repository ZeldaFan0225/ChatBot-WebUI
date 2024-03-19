import { BaseChatMessage } from "./classes/BaseConnector";


/* Types for Configuration */

export interface Config {
    modelConfigurations: Record<string, ModelConfiguration>;
    connectors: Record<string, string>;
}

export interface ModelConfiguration {
    connector: string;
    displayName?: string;
    systemInstruction: string;
    connectorOptions: Record<string, any>;
}


/* API Interface Types */

export interface ChatCompletionRequest {
    model: string;
    messages: BaseChatMessage[];
    overrideOptions?: Record<string, any>;
}