let selectedModel;
let modelOptions = {}
let overrideModelOptions = {};
let systemInstructions = {};
let overrideSystemInstructions = {};
let messages = []

function saveOverrideModelOptions() {
    localStorage.setItem('overrideModelOptions', JSON.stringify(overrideModelOptions));
}

function loadOverrideModelOptions() {
    overrideModelOptions = JSON.parse(localStorage.getItem('overrideModelOptions')) || {};
}

function saveOverrideSystemInstructions() {
    localStorage.setItem('overrideSystemInstructions', JSON.stringify(overrideSystemInstructions));
}

function loadOverrideSystemInstructions() {
    overrideSystemInstructions = JSON.parse(localStorage.getItem('overrideSystemInstructions')) || {};
}

function setSelectedModel(model) {
    localStorage.setItem('selectedModel', model);
    selectedModel = model;
}

function loadSelectedModel() {
    selectedModel = localStorage.getItem('selectedModel');
}

function saveMessages() {
    localStorage.setItem('messages', JSON.stringify(messages));
}

function loadMessages() {
    messages = JSON.parse(localStorage.getItem('messages')) || [];
}