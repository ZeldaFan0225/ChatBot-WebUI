function htmlEntities(str) {
    const text = String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return markdownToHtml(text).replaceAll("\n", "<br>");
}

function expandTextbox() {
    const textbox = document.getElementById("textbox")
    
    textbox.style.height = "";
    textbox.style.height = Math.min(textbox.scrollHeight, 200) + "px";
}

function resetChat() {
    if(!confirm("Do you want to reset the chat?")) return;
    messages = []
    document.getElementById("messages").innerHTML = ""
    expandTextbox()
}

function markdownToHtml(markdown) {
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
    const text = markdown.replace(codeBlockRegex, '<pre><code lang="$1">$2</code></pre>');

    const inlineCodeRegex = /`([^`]*)`/g;
    return text.replace(inlineCodeRegex, (match, code) => `<code>${code}</code>`);
}