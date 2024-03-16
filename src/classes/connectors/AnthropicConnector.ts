import { BaseChatMessage, BaseConnector, BaseConnectorInitOptions } from "../BaseConnector";

export default class AnthropicConnector extends BaseConnector {
    #apiKey: string;
    #requestUrl: string;
    #generationOptions: Partial<Omit<AnthropicPayload, "messages" | "model">>  & {model: string; max_tokens: number;};
    constructor(options: AnthropicConnectorInitOptions) {
        super()
        this.#apiKey = options.apiKey;
        this.#requestUrl = options.url ;
        this.#generationOptions = options.generationOptions;
    }

    get generationOptions(): Record<string, any> {
        return this.#generationOptions;
    }

    async requestChatCompletion(messages: BaseChatMessage[], overrideOptions?: Record<string, any>): Promise<string> {
        // convert message format to openai format
        const openAiMessages = messages
            .map(m => this.convertToAnthropicMessage(m))
            .filter(m => m !== null) as AnthropicChatMessage[];

        const system = messages.find(m => m.role === "system")?.content || "";

        const response = await this.sendRequest({
            ...this.#generationOptions,
            ...overrideOptions,
            system,
            messages: openAiMessages
        })

        const result = response.content.map(c => c.text).join("\n");

        if(typeof result !== "string") throw new Error("Invalid response from API");

        return result;
    }

    private async sendRequest(payload: AnthropicPayload): Promise<AnthropicResponse> {
        const result = await fetch(this.#requestUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01",
                "x-api-key": `${process.env[this.#apiKey]}`
            },
            body: JSON.stringify(payload)
        })

        const response = await result.json();

        if(response.type === "error" || response.error) throw new Error(`${response.error.type} | ${response.error.message}`)

        return response as AnthropicResponse;
    }

    private convertToAnthropicMessage(message: BaseChatMessage): AnthropicChatMessage | null {
        if(message.role !== "user" && message.role !== "assistant") return null;

        const openAiMessage: AnthropicChatMessage = {
            content: message.content,
            role: message.role,
        }
        // support for images at a later point in time
        /*if(message.attachmentsUrls) {
            const imageUrls = message.attachmentsUrls.map(url => {
                // request image from url and convert to base64
                fetch(url)
                    .then(res => res.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onloadend = function() {
                            const base64data = reader.result;
                            return {
                                type: "image" as const,
                                source: {
                                    type: "base64" as const,
                                    // determine media type from request
                                    media_type: "image/png",
                                    data: base64data
                                }
                            }
                        }
                    })
            })

            openAiMessage.content = [...imageUrls, {type: "text", text: message.content}]
        }*/
        return openAiMessage;
    }
}

export interface AnthropicConnectorInitOptions extends BaseConnectorInitOptions {
    apiKey: string;
    url: string;
    generationOptions: Partial<Omit<AnthropicPayload, "messages" | "model">>  & {model: string; max_tokens: number;}
}

/* https://docs.anthropic.com/claude/docs/models-overview */
export interface AnthropicPayload {
    messages: AnthropicChatMessage[];
    model: string;
    system: string;
    max_tokens: number;
    stop_sequences?: string[];
    temperature?: number;
    top_p?: number;
    top_k?: number;
}

export interface AnthropicResponse {
    id: string;
    type: string;
    role: string;
    content: {
        type: "text";
        text: string;
    }[];
    model: string;
    stop_reason: string;
    stop_sequence: string;
    usage: {
        input_tokens: number;
        output_tokens: number;
    }
}


export interface AnthropicChatMessage {
    role: "user" | "assistant";
    content: string | ({
        type: "text";
        text: string;
    } | {
        type: "image";
        source: {
            type: "base64";
            media_type: string;
            data: string;
        }
    })[];
}