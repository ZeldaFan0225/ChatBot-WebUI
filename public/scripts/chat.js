class Chat {
    static loadedModalModel;
    static expandTextbox() {
        const textbox = document.getElementById("textbox")
        
        textbox.style.height = "";
        textbox.style.height = Math.min(textbox.scrollHeight, 200) + "px";
    }

    static resetModalModelOverrides() {
        delete Storage.overrideModelOptions[Storage.loadedModalModel]
        delete Storage.overrideSystemInstructions[Storage.loadedModalModel]
    
        Storage.saveOverrideModelOptions()
        Storage.saveOverrideSystemInstructions()
        
        const modeldata = Storage.modelOptions[Storage.loadedModalModel]
        document.getElementById("model-parameters").firstElementChild.innerText = JSON.stringify(modeldata, null, 2)
        document.getElementById("model-systeminstruct").value = Storage.systemInstructions[Storage.loadedModalModel]
    }

    static handleModalSomewhereElseClick(event) {
        const path = event.composedPath()
        if(path?.[0]?.id === "model-modal") hideModal()
    }

    static hideModal() {
        try {
            Storage.overrideModelOptions[Storage.loadedModalModel] = JSON.parse(document.getElementById("model-parameters").innerText)
        } catch {
            return alert("Invalid JSON")
        }
        const modelSystemInstruct = document.getElementById("model-systeminstruct").value
        if(!modelSystemInstruct) return alert("System Instruction cannot be empty")
        if(modelSystemInstruct !== Storage.systemInstructions[Storage.loadedModalModel]) {
            Storage.overrideSystemInstructions[Storage.loadedModalModel] = modelSystemInstruct
        }
        
        Storage.saveOverrideModelOptions()
        Storage.saveOverrideSystemInstructions()
    
        document.querySelector(`.model[model="${Storage.loadedModalModel}"]`).lastElementChild.innerText = `${Object.keys({...Storage.modelOptions[Storage.loadedModalModel], ...Storage.overrideModelOptions[Storage.loadedModalModel]}).length} Parameters`
        Storage.loadedModalModel = undefined;
    
        document.getElementById("model-modal").style.display = "none"
    }

    static displayModelDetails(element) {
        document.getElementById("model-modal").style.display = ""
        const model = element.parentElement.parentElement.getAttribute("model")
        const modeldata = Storage.overrideModelOptions[model] || Storage.modelOptions[model]
    
        Storage.loadedModalModel = model;
    
        document.getElementById("model-name").innerText = element.previousElementSibling.innerText || model
        document.getElementById("model-parameters").firstElementChild.innerText = JSON.stringify(modeldata, null, 2)
        document.getElementById("model-systeminstruct").value = Storage.overrideSystemInstructions[model] || Storage.systemInstructions[model]
    }

    static selectModel(element, event) {
        const path = event?.composedPath()
        if(path?.some(e => e.nodeName === "IMG")) return;
        document.querySelectorAll(".model.selected").forEach(e => e.classList.remove("selected"))
        element.classList.add("selected")
        Storage.setSelectedModel(element.getAttribute("model"))
    }

    static displayLoadingMessage() {
        const message = `<div class="message loading">
            <div class="pfp">
                <img src="/assets/images/bot_pfp.jpg">
            </div>
            <div class="message-body">
                <span class="username">
                    ChatBot
                </span>
                <div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </div>`
        
        document.getElementById("messages").innerHTML = message + document.getElementById("messages").innerHTML
    }

    static displayChatMessage(role, content, hasAttachment, error) {
        document.querySelector(".message.loading")?.remove()
        if(role !== "user" && role !== "bot") return ""
        const message = `<div class="message">
            <div class="pfp">
                <img src="/assets/images/${role === "bot" ? "bot_pfp" : "user_pfp"}.jpg">
            </div>
            <div class="message-body">
                <span class="username">
                    ${role === "bot" ? "ChatBot" : "You"}
                </span>
                <div${error ? " style=\"color: var(--red);\"" : ""}>
                    ${hasAttachment ? "<strong>[Attachment]</strong><br>" : ""}
                    ${Utils.htmlEntities(content)}
                </div>
            </div>
        </div>`
    
        document.getElementById("messages").innerHTML = message + document.getElementById("messages").innerHTML
    }

    static async requestChatCompletion() {
        if(!Storage.selectedModel) return;
        return await fetch(`/api/completion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: Storage.selectedModel,
                overrideOptions: Storage.overrideModelOptions[Storage.selectedModel] || {},
                messages: [
                    {
                        role: "system",
                        content: Storage.overrideSystemInstructions[Storage.selectedModel] || Storage.systemInstructions[Storage.selectedModel]
                    },
                    ...Storage.messages
                ]
            })
        }).then(res => res.json())
    }

    static async sendMessage() {
        const message = document.getElementById("textbox").value.trim()
        if(!message) return;
        document.getElementById("textbox").value = ""
        Utils.hideAttachmentUpload()
        const attachment = await Utils.getAttachmentString()
        Utils.clearAttachments()
    
        Chat.expandTextbox()
    
        Chat.displayChatMessage("user", message, !!attachment)
        Storage.messages.push({
            role: "user",
            content: message,
            attachments: attachment ? [attachment] : undefined,
            hasAttachment: !!attachment
        })
        Chat.displayLoadingMessage()
        const response = await Chat.requestChatCompletion()
        if(response.error) {
            Chat.displayChatMessage("bot", response.message || response.error, false, true)
            return;
        }
        Chat.displayChatMessage("bot", response.result)
        Storage.messages.push({
            role: "assistant",
            content: response.result
        })
        Storage.saveMessages()
    }
}

Storage.loadMessages()
Storage.loadSelectedModel()
Storage.loadOverrideModelOptions()
Storage.loadOverrideSystemInstructions()

Storage.messages.forEach(m => {
    if(m.role === "user") Chat.displayChatMessage("user", m.content, m.hasAttachment)
    if(m.role === "assistant") Chat.displayChatMessage("bot", m.content)
})

fetch(`/api/models`)
.then(async res => {
    const data = await res.json()

    const list = Object.entries(data).map(([name, data], i) => {
        Storage.systemInstructions[name] = data.systemInstruction || ""
        Storage.modelOptions[name] = data.generationOptions

        return `<div class="model ${!i ? "selected" : ""}" onclick="Chat.selectModel(this, event)" model="${name}">
            <div>
                <span>${data.displayName || name}</span>
                <img src="/assets/images/more.png" onclick="Chat.displayModelDetails(this)">
            </div>
            <span>${Object.keys({...data.generationOptions, ...Storage.overrideModelOptions[name]}).length} Parameters</span>
        </div>`
    })

    document.getElementById("models").innerHTML = list.join("")
    Storage.selectedModel ??= Object.keys(data)[0]
    Chat.selectModel(document.querySelector(`.model[model="${Storage.selectedModel}"]`))
})