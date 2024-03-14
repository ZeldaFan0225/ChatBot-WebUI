async function requestChatCompletion() {
    await fetch(`/api/completion`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "ChatGPT",
            messages: [{
                role: "user",
                content: "tell me a joke"
            }]
        })
    })
}