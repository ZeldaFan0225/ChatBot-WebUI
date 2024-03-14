async function sendMessage() {
    const message = document.getElementById("textbox").value
    displayChatMessage("user", message)
    const response = await requestChatCompletion(message)
    displayChatMessage("bot", response.result)
}

async function requestChatCompletion(text) {
    return await fetch(`/api/completion`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "Claude",
            messages: [{
                role: "user",
                content: text
            }]
        })
    }).then(res => res.json())
}

function displayChatMessage(role, content) {
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

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replaceAll("\n", "<br>");
}