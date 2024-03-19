export abstract class BaseConnector {
    public displayName?: string;
    abstract requestChatCompletion(messages: BaseChatMessage[], overrideOptions?: Record<string, any>): Promise<string>;
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
    // array of data strings
    attachments?: string[];
}