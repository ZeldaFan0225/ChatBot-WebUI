import { BaseChatMessage, BaseConnector, BaseConnectorInitOptions } from "../BaseConnector";

export default class OpenAiCompatibleConnector extends BaseConnector {
    #apiKey: string;
    #requestUrl: string;
    #generationOptions: Partial<Omit<OpenAiCompatiblePayload, "messages" | "model">>  & {model: string;};
    constructor(options: OpenAiCompatibleConnectorInitOptions) {
        super()
        this.#apiKey = options.apiKey;
        this.#requestUrl = options.url;
        this.#generationOptions = options.generationOptions;
    }

    get generationOptions(): Record<string, any> {
        return this.#generationOptions;
    }

    async requestChatCompletion(messages: BaseChatMessage[], overrideOptions?: Record<string, any>): Promise<string> {
        // convert message format to openai format
        const openAiMessages = messages
            .map(m => this.convertToOpenAiMessage(m))
            .filter(m => m !== null) as OpenAiChatMessage[];

        const response = await this.sendRequest({
            ...this.#generationOptions,
            ...overrideOptions,
            messages: openAiMessages
        })

        const result = response.choices[0]?.message.content;

        if(typeof result !== "string") throw new Error("Invalid response from API");

        return result;
    }

    private async sendRequest(payload: OpenAiCompatiblePayload): Promise<OpenAiCompatibleResponse> {
        const result = await fetch(this.#requestUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env[this.#apiKey]}`
            },
            body: JSON.stringify(payload)
        })

        const response = await result.json();

        if(response.error) throw new Error(response.error.message || response.error);

        return response as OpenAiCompatibleResponse;
    }

    private convertToOpenAiMessage(message: BaseChatMessage): OpenAiChatMessage | null {
        if(message.role !== "user" && message.role !== "assistant" && message.role !== "system") return null;

        const openAiMessage: OpenAiChatMessage = {
            content: message.content,
            role: message.role,
            name: message.name
        }
        if(message.role === "user") {
            if(message.attachmentsUrls) {
                const imageUrls = message.attachmentsUrls.map(url => ({
                    type: "image" as const,
                    url
                }))

                openAiMessage.content = [...imageUrls, {type: "text", text: message.content}]
            }
        }
        return openAiMessage;
    }
}

export interface OpenAiCompatibleConnectorInitOptions extends BaseConnectorInitOptions {
    apiKey: string;
    url: string;
    generationOptions: Partial<Omit<OpenAiCompatiblePayload, "messages" | "model">>  & {model: string;}
}

export interface OpenAiCompatiblePayload {
    messages: OpenAiChatMessage[];
    model: string;
    frequency_penalty?: number;
    logit_bias?: Record<string, number>;
    max_tokens?: number;
    presence_penalty?: number;
    response_format?:  {type: "text" | "json_object"};
    seed?: number;
    stop?: string | string[];
    temperature?: number;
    top_p?: number;
}

export interface OpenAiCompatibleResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    system_fingerprint: string;
    choices: {
        index: number;
        message: OpenAiBotMessage;
        finish_reason: string;
    }[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    }
}

export type OpenAiChatMessage = OpenAiUserMessage | OpenAiBotMessage | OpenAiSystemMessage;

export interface OpenAiBaseMessage {
    role: string;
    name?: string;
}

export interface OpenAiUserMessage extends OpenAiBaseMessage {
    role: "user";
    content: string | ({
        type: "text", text: string
    } | {
        type: "image", url: string
    })[]
}

export interface OpenAiBotMessage extends OpenAiBaseMessage {
    role: "assistant";
    content: string
}

export interface OpenAiSystemMessage extends OpenAiBaseMessage {
    role: "system";
    content: string
}