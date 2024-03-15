let model;
let models = []
let messages = []
let systemInstruct = "You are a texan chatbot. You end every one of your sentences with 'yehaw' no matter what. You also have a tendency to say 'howdy' at the beginning of your sentences"

fetch(`/api/models`)
.then(async res => {
    const data = await res.json()
    models = data

    const list = Object.entries(models).map(([name, data], i) =>
        `<div class="model ${!i ? "selected" : ""}" onclick="selectModel(this, event)" model="${name}">
            <div>
                <span>${name}</span>
                <img src="/assets/more.png">
            </div>
            <span>${Object.keys(data).length} Parameters</span>
        </div>`
    )

    document.getElementById("models").innerHTML = list.join("")
    selectModel(document.getElementById("models").firstElementChild)
})


async function sendMessage() {
    const message = document.getElementById("textbox").value
    document.getElementById("textbox").value = ""

    expandTextbox()

    displayChatMessage("user", message)
    messages.push({
        role: "user",
        content: message
    })
    displayLoadigMessage()
    const response = await requestChatCompletion()
    displayChatMessage("bot", response.result)
    messages.push({
        role: "assistant",
        content: response.result
    })
}

async function requestChatCompletion() {
    if(!model) return;
    return await fetch(`/api/completion`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: "system",
                    content: systemInstruct
                },
                ...messages
            ]
        })
    }).then(res => res.json())
}

function displayChatMessage(role, content) {
    document.querySelector(".message.loading")?.remove()
    if(role !== "user" && role !== "bot") return ""
    const message = `<div class="message">
        <div class="pfp">
            <img src="/assets/${role === "bot" ? "bot_pfp" : "user_pfp"}.jpg">
        </div>
        <div class="message-body">
            <span class="username">
                ${role === "bot" ? "ChatBot" : "You"}
            </span>
            <div>
                ${htmlEntities(content)}
            </div>
        </div>
    </div>`

    document.getElementById("messages").innerHTML = message + document.getElementById("messages").innerHTML
}

function displayLoadigMessage() {
    const message = `<div class="message loading">
        <div class="pfp">
            <img src="/assets/bot_pfp.jpg">
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
    model = element.getAttribute("model")
}

function displayModelDetails() {

}