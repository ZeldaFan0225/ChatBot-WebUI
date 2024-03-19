function htmlEntities(str) {
    const text = String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return markdownToHtml(text).replaceAll("\n", "<br>");
}

function expandTextbox() {
    const textbox = document.getElementById("textbox")
    
    textbox.style.height = "";
    textbox.style.height = Math.min(textbox.scrollHeight, 200) + "px";
}

function textboxInput(event) {
    if(event.key === "Enter" && !event.shiftKey) {
        sendMessage()
    }
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

function expandActions() {
    document.getElementById("action-expander").classList.toggle("expanded")
    document.getElementById("actions").classList.toggle("expanded")
}

function collapseActions() {
    document.getElementById("action-expander").classList.remove("expanded")
    document.getElementById("actions").classList.remove("expanded")
}

window.addEventListener("click", event => {
    const path = event.composedPath()
    if(!path.some(e => e.id === "action-expander")) collapseActions()
})

function resetSaved() {
    if(!confirm("Do you want to reset the custom change you made?")) return;
    localStorage.clear()
    alert("Reset the changes")
    location.reload()
}

function hideSidebar() {
    document.querySelector(".sidebar-left").classList.toggle("hidden")
}

function exportChat() {
    downloadFile(JSON.stringify(messages, null, 2), "chat.json");
}

function downloadFile(content, filename) {
    const link = document.createElement("a");
    const file = new Blob([content], { type: 'text/plan' });
    link.href = URL.createObjectURL(file);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    link.remove();
};

function displayAttachmentUpload() {
    document.getElementById("fileupload").classList.remove("hidden")
}

function toggleAttachmentUpload() {
    document.getElementById("fileupload").classList.toggle("hidden")
}

function hideAttachmentUpload() {
    document.getElementById("fileupload").classList.add("hidden")
}

async function getAttachmentString() {
    const file = document.getElementById("fileattachment")?.files[0];
    if(!file) return null;
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes

    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (jpg, jpeg, png, gif).');
            resolve(null);
        } else if (file.size > maxSize) {
            alert('File size exceeds 10MB limit. Please select a smaller file.');
            resolve(null);
        } else {
            const reader = new FileReader();

            reader.onload = function(event) {
                resolve(event.target.result);
            };

            reader.readAsDataURL(file);
        }
    })
}

async function previewAttachment() {
    const attachment = await getAttachmentString()
    if(!attachment) {
        document.getElementById("attachmentpreview").removeAttribute("src")
        document.getElementById("attachmentpreview").setAttribute("style", "display:none;")
        return;
    }
    document.getElementById("attachmentpreview").src = attachment
    document.getElementById("attachmentpreview").removeAttribute("style")
}

function pasteOnTextbox(event) {
    const dT = event.clipboardData || window.clipboardData;
    const file = dT.files[ 0 ];
    if(file) {
        displayAttachmentUpload()
        const fileList = new DataTransfer();
        fileList.items.add(file);
        document.getElementById("fileattachment").files = fileList.files
        previewAttachment()
    }
}

function clearAttachments() {
    document.getElementById("fileattachment").value = null
    document.getElementById("attachmentpreview").removeAttribute("src")
    document.getElementById("attachmentpreview").setAttribute("style", "display:none;")
}