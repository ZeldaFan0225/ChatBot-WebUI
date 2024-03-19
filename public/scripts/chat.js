loadMessages()
loadSelectedModel()
loadOverrideModelOptions()
loadOverrideSystemInstructions()

messages.forEach(m => {
    if(m.role === "user") displayChatMessage("user", m.content, m.hasAttachment)
    if(m.role === "assistant") displayChatMessage("bot", m.content)
})

fetch(`/api/models`)
.then(async res => {
    const data = await res.json()

    const list = Object.entries(data).map(([name, data], i) => {
        systemInstructions[name] = data.systemInstruction || ""
        modelOptions[name] = data.generationOptions

        return `<div class="model ${!i ? "selected" : ""}" onclick="selectModel(this, event)" model="${name}">
            <div>
                <span>${data.displayName || name}</span>
                <img src="/assets/images/more.png" onclick="displayModelDetails(this)">
            </div>
            <span>${Object.keys({...data.generationOptions, ...overrideModelOptions[name]}).length} Parameters</span>
        </div>`
    })

    document.getElementById("models").innerHTML = list.join("")
    selectedModel ??= Object.keys(data)[0]
    selectModel(document.querySelector(`.model[model="${selectedModel}"]`))
})


async function sendMessage() {
    const message = document.getElementById("textbox").value.trim()
    if(!message) return;
    document.getElementById("textbox").value = ""
    hideAttachmentUpload()
    const attachment = await getAttachmentString()
    clearAttachments()

    expandTextbox()

    displayChatMessage("user", message, !!attachment)
    messages.push({
        role: "user",
        content: message,
        attachments: attachment ? [attachment] : undefined,
        hasAttachment: !!attachment
    })
    displayLoadingMessage()
    const response = await requestChatCompletion()
    if(response.error) {
        displayChatMessage("bot", response.message || response.error, false, true)
        return;
    }
    displayChatMessage("bot", response.result)
    messages.push({
        role: "assistant",
        content: response.result
    })
    saveMessages()
}

async function requestChatCompletion() {
    if(!selectedModel) return;
    return await fetch(`/api/completion`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: selectedModel,
            overrideOptions: overrideModelOptions[selectedModel] || {},
            messages: [
                {
                    role: "system",
                    content: overrideSystemInstructions[selectedModel] || systemInstructions[selectedModel]
                },
                ...messages
            ]
        })
    }).then(res => res.json())
}

function displayChatMessage(role, content, hasAttachment, error) {
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
                ${htmlEntities(content)}
            </div>
        </div>
    </div>`

    document.getElementById("messages").innerHTML = message + document.getElementById("messages").innerHTML
}

function displayLoadingMessage() {
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

function selectModel(element, event) {
    const path = event?.composedPath()
    if(path?.some(e => e.nodeName === "IMG")) return;
    document.querySelectorAll(".model.selected").forEach(e => e.classList.remove("selected"))
    element.classList.add("selected")
    setSelectedModel(element.getAttribute("model"))
}

let loadedModalModel;
function displayModelDetails(element) {
    document.getElementById("model-modal").style.display = ""
    const model = element.parentElement.parentElement.getAttribute("model")
    const modeldata = overrideModelOptions[model] || modelOptions[model]

    loadedModalModel = model;

    document.getElementById("model-name").innerText = element.previousElementSibling.innerText || model
    document.getElementById("model-parameters").firstElementChild.innerText = JSON.stringify(modeldata, null, 2)
    document.getElementById("model-systeminstruct").value = overrideSystemInstructions[model] || systemInstructions[model]
}

function hideModal() {
    try {
        overrideModelOptions[loadedModalModel] = JSON.parse(document.getElementById("model-parameters").innerText)
    } catch {
        return alert("Invalid JSON")
    }
    const modelSystemInstruct = document.getElementById("model-systeminstruct").value
    if(!modelSystemInstruct) return alert("System Instruction cannot be empty")
    if(modelSystemInstruct !== systemInstructions[loadedModalModel]) {
        overrideSystemInstructions[loadedModalModel] = modelSystemInstruct
    }
    
    saveOverrideModelOptions()
    saveOverrideSystemInstructions()

    document.querySelector(`.model[model="${loadedModalModel}"]`).lastElementChild.innerText = `${Object.keys({...modelOptions[loadedModalModel], ...overrideModelOptions[loadedModalModel]}).length} Parameters`
    loadedModalModel = undefined;

    document.getElementById("model-modal").style.display = "none"
}

function handleModalSomewhereElseClick(event) {
    const path = event.composedPath()
    if(path?.[0]?.id === "model-modal") hideModal()
}

function resetModalModelOverrides() {
    delete overrideModelOptions[loadedModalModel]
    delete overrideSystemInstructions[loadedModalModel]

    saveOverrideModelOptions()
    saveOverrideSystemInstructions()
    
    const modeldata = modelOptions[loadedModalModel]
    document.getElementById("model-parameters").firstElementChild.innerText = JSON.stringify(modeldata, null, 2)
    document.getElementById("model-systeminstruct").value = systemInstructions[loadedModalModel]
}