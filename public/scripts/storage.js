class Storage {
    static selectedModel;
    static modelOptions = {};
    static overrideModelOptions = {};
    static systemInstructions = {};
    static overrideSystemInstructions = {};
    static messages = [];

    static saveOverrideModelOptions() {
        localStorage.setItem('overrideModelOptions', JSON.stringify(Storage.overrideModelOptions));
    }

    static loadOverrideModelOptions() {
        Storage.overrideModelOptions = JSON.parse(localStorage.getItem('overrideModelOptions')) || {};
    }

    static saveOverrideSystemInstructions() {
        localStorage.setItem('overrideSystemInstructions', JSON.stringify(Storage.overrideSystemInstructions));
    }

    static loadOverrideSystemInstructions() {
        Storage.overrideSystemInstructions = JSON.parse(localStorage.getItem('overrideSystemInstructions')) || {};
    }

    static setSelectedModel(model) {
        localStorage.setItem('selectedModel', model);
        Storage.selectedModel = model;
    }

    static loadSelectedModel() {
        Storage.selectedModel = localStorage.getItem('selectedModel');
    }

    static saveMessages() {
        localStorage.setItem('messages', JSON.stringify(Storage.messages.map(m => ({...m, attachments: undefined, hasAttachment: m.attachments?.length > 0}))));
    }

    static loadMessages() {
        Storage.messages = JSON.parse(localStorage.getItem('messages')) || [];
    }
}
