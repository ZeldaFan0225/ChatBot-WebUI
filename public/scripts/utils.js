class Utils {
    static htmlEntities(str) {
        const text = String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        return this.markdownToHtml(text).replaceAll("\n", "<br>");
    }

    static textboxInput(event) {
        if(event.key === "Enter" && !event.shiftKey) {
            Chat.sendMessage()
        }
    }

    static resetChat() {
        if(!confirm("Do you want to reset the chat?")) return;
        Storage.messages = []
        Storage.saveMessages()
        document.getElementById("messages").innerHTML = ""
        Chat.expandTextbox()
    }

    static markdownToHtml(markdown) {
        const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
        const text = markdown.replace(codeBlockRegex, '<pre><code lang="$1">$2</code></pre>');

        const inlineCodeRegex = /`([^`]*)`/g;
        return text.replace(inlineCodeRegex, (match, code) => `<code>${code}</code>`);
    }

    static expandActions() {
        document.getElementById("action-expander").classList.toggle("expanded")
        document.getElementById("actions").classList.toggle("expanded")
    }

    static collapseActions() {
        document.getElementById("action-expander").classList.remove("expanded")
        document.getElementById("actions").classList.remove("expanded")
    }

    static resetSaved() {
        if(!confirm("Do you want to reset the custom change you made?")) return;
        localStorage.clear()
        alert("Reset the changes")
        location.reload()
    }

    static hideSidebar() {
        document.querySelector(".sidebar-left").classList.toggle("hidden")
    }

    static exportChat() {
        Utils.downloadFile(JSON.stringify(Storage.messages, null, 2), "chat.json");
    }

    static downloadFile(content, filename) {
        const link = document.createElement("a");
        const file = new Blob([content], { type: 'text/plan' });
        link.href = URL.createObjectURL(file);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
        link.remove();
    };

    static displayAttachmentUpload() {
        document.getElementById("fileupload").classList.remove("hidden")
    }

    static toggleAttachmentUpload() {
        document.getElementById("fileupload").classList.toggle("hidden")
    }

    static hideAttachmentUpload() {
        document.getElementById("fileupload").classList.add("hidden")
    }

    static async getAttachmentString() {
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

    static async previewAttachment() {
        const attachment = await Utils.getAttachmentString()
        if(!attachment) {
            document.getElementById("attachmentpreview").removeAttribute("src")
            document.getElementById("attachmentpreview").setAttribute("style", "display:none;")
            return;
        }
        document.getElementById("attachmentpreview").src = attachment
        document.getElementById("attachmentpreview").removeAttribute("style")
    }

    static pasteOnTextbox(event) {
        const dT = event.clipboardData || window.clipboardData;
        const file = dT.files[ 0 ];
        if(file) {
            Utils.displayAttachmentUpload()
            const fileList = new DataTransfer();
            fileList.items.add(file);
            document.getElementById("fileattachment").files = fileList.files
            Utils.previewAttachment()
        }
    }

    static clearAttachments() {
        document.getElementById("fileattachment").value = null
        document.getElementById("attachmentpreview").removeAttribute("src")
        document.getElementById("attachmentpreview").setAttribute("style", "display:none;")
    }
}

window.addEventListener("click", event => {
    const path = event.composedPath()
    if(!path.some(e => e.id === "action-expander")) Utils.collapseActions()
})