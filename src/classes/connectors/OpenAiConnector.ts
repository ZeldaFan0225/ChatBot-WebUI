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

        const validated = await this.passesModeration(openAiMessages)

        if(!validated) throw new Error("Message did not pass moderation")

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

    private async passesModeration(messages: OpenAiChatMessage[]): Promise<boolean> {
        const latestMessage = messages.at(-1)
        if(latestMessage?.role !== "user") return true;

        if(!this.#requestUrl.startsWith("https://api.openai.com/")) return true;

        const content = typeof latestMessage.content === "string" ? 
            latestMessage.content :
            latestMessage.content.filter(c => c.type === "text").map(c => (c as any).text).join(" ");
            
        const openai_req = await fetch(`https://api.openai.com/v1/moderations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env[this.#apiKey]}`
            },
            body: JSON.stringify({
                input: content
            })
        })

        const data: OpenAIModerationResponse = await openai_req.json()
        return !data?.results?.[0]?.flagged
    }

    private convertToOpenAiMessage(message: BaseChatMessage): OpenAiChatMessage | null {
        if(message.role !== "user" && message.role !== "assistant" && message.role !== "system") return null;

        const openAiMessage: OpenAiChatMessage = {
            content: message.content,
            role: message.role,
            name: message.name
        }
        if(message.role === "user") {
            if(message.attachments) {
                const imageUrls = message.attachments.map(url => ({
                    type: "image" as const,
                    image_url: {
                        url
                    }
                }))

                openAiMessage.content = [...imageUrls, {type: "text", text: message.content}]
            }
        }
        return openAiMessage;
    }
}

interface OpenAIModerationResponse {
    id: string,
    model: string,
    results: {
        categories: Record<string, boolean>,
        category_scores: Record<string, boolean>,
        flagged: boolean
    }[]
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
        type: "image", image_url: {url: string, detail?: "auto" | "low" | "high"}
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