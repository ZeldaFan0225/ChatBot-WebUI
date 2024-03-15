export abstract class BaseConnector {
    abstract requestChatCompletion(messages: BaseChatMessage[]): Promise<string>;
    abstract get generationOptions(): Record<string, any>;
}

/* Types for BaseConnector */
export interface BaseConnectorInitOptions {
    [x: string]: any;
}

export interface BaseChatMessage {
    content: string;
    role: string;
    name?: string;
    attachmentsUrls?: string[];
}