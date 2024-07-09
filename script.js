document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        panelsContainer: document.getElementById('panels-container'),
        mainPanel: document.getElementById('main-panel'),
        rightPanel: document.getElementById('right-panel'),
        dynamicFields: document.getElementById('dynamic-fields'),
        toggleOptions: document.getElementById('toggle-options'),
        taskRadios: document.querySelectorAll('input[name="task"]'),
        container: document.querySelector('.container'),
        outputFormatRadios: document.querySelectorAll('input[name="output-format"]'),
        customFormatInput: document.getElementById('custom-format'),
        generateBtn: document.getElementById('generate-btn'),
        result: document.getElementById('result'),
        generatedPrompt: document.getElementById('generated-prompt'),
        copyBtn: document.getElementById('copy-btn'),
        closeBtn: document.getElementById('close-btn')
    };

    const createField = (id, label, type = 'text', placeholder = '', isOptional = false, extraAttributes = '') => {
        return `
            <div class="input-group mb-4">
                <label for="${id}" class="block text-sm font-medium text-gray-700 mb-2">
                    ${label}${isOptional ? ' (optional)' : ''}:
                </label>
                <${type === 'textarea' ? 'textarea' : 'input'} id="${id}" class="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" ${type !== 'textarea' ? `type="${type}"` : ''} placeholder="${placeholder}" ${type === 'textarea' ? 'rows="4"' : ''} ${extraAttributes}></${type === 'textarea' ? 'textarea' : 'input'}>
            </div>
        `;
    };

    const createToggle = (id, label, isChecked = false, recommendation = '') => {
        return `
            <div class="mb-2">
                <label class="inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="form-checkbox text-indigo-600" id="${id}" ${isChecked ? 'checked' : ''}>
                    <span class="ml-2">${label}</span>
                    ${recommendation ? `<span class="ml-2 text-sm text-gray-500">(${recommendation})</span>` : ''}
                </label>
            </div>
        `;
    };

    const createSlider = (id, label) => {
        return `
            <div class="mb-4">
                <label for="${id}" class="block text-sm font-medium text-gray-700 mb-1">${label}:</label>
                <input type="range" id="${id}" min="1" max="3" value="2" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                <div class="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Least Detailed</span>
                    <span>Normal</span>
                    <span>Most Detailed</span>
                </div>
            </div>
        `;
    };

    const taskConfigs = {
        general: {
            fields: [
                { id: 'vanilla-prompt', label: 'Your Prompt', type: 'textarea', placeholder: 'Enter your prompt here' },
            ],
            slider: { id: 'detail-level', label: 'Level of Detail' },
            toggles: [
                { id: 'provide-examples', label: 'Provide Examples', isChecked: true },
                { id: 'explain-like-im-3', label: 'Explain Like I\'m 3', isChecked: false }
            ]
        },
        'generate-ideas': {
            fields: [
                { id: 'context', label: 'Context', type: 'textarea', placeholder: 'Provide any relevant background information or context' },
                { id: 'central-idea', label: 'What are you looking to accomplish', type: 'textarea', placeholder: 'Describe the central idea or goal you need help with' },
                { id: 'constraints', label: 'Constraints', type: 'textarea', placeholder: 'Describe any limitations or specific requirements that need to be considered' }
            ],
            toggles: [
                { id: 'provide-code-snippet', label: 'Provide Code Snippet', isChecked: true },
                { id: 'step-by-step', label: 'Enable Step-by-Step Thinking', isChecked: false, recommendation: 'may produce better results' }
            ]
        },
        optimize: {
            fields: [
                { id: 'code-snippet', label: 'Code Snippet', type: 'textarea', placeholder: 'Paste the code you want to optimize' }
            ],
            toggles: []
        },
        debug: {
            fields: [
                { id: 'error-message', label: 'Error Message', type: 'textarea', placeholder: 'Describe the error you\'re encountering' },
                { id: 'code-snippet', label: 'Code Snippet', type: 'textarea', placeholder: 'Paste your code here', isOptional: true }
            ],
            toggles: [
                { id: 'step-by-step', label: 'Enable Step-by-Step Thinking', isChecked: false, recommendation: 'may produce better results' }
            ]
        }
    };

    const updateDynamicFields = (taskType) => {
        const config = taskConfigs[taskType];
        let fieldsHTML = config.fields.map(field => createField(field.id, field.label, field.type, field.placeholder, field.isOptional, field.extraAttributes)).join('');
        
        if (config.slider) {
            fieldsHTML += createSlider(config.slider.id, config.slider.label);
        }
        
        const togglesHTML = config.toggles
            .map(toggle => createToggle(toggle.id, toggle.label, toggle.isChecked, toggle.recommendation))
            .join('');
    
        elements.dynamicFields.innerHTML = fieldsHTML;
        elements.toggleOptions.innerHTML = togglesHTML;
    
        // Hide or show output format based on task type
        const outputFormatSection = document.querySelector('.input-group:has(input[name="output-format"])');
        if (outputFormatSection) {
            outputFormatSection.style.display = taskType === 'general' ? 'none' : 'block';
        }
    };

    const generatePrompt = (data) => {
        const { task, outputFormat, customFormat, stepByStep, selfAssessment, provideCodeSnippet, provideExamples, explainLikeIm3, detailLevel, ...fields } = data;
        let prompt = "You are an expert software engineer with extensive experience in modern technologies and best practices. ";
    
        if (task === 'general') {
            prompt += "As an industry expert, please respond to the following prompt:\n\n";
            prompt += `${fields['vanilla-prompt']}\n\n`;
            prompt += "When responding, please adhere to the following guidelines:\n";
            prompt += "1. Provide your response in a concise and structured manner.\n";
            prompt += "2. Incorporate relevant industry best practices and standards.\n";
            prompt += "3. Use clear headings and subheadings to organize your response.\n";
            prompt += "4. Include practical examples or code snippets where appropriate.\n";
            prompt += "5. Address potential challenges or considerations related to the topic.\n";
            prompt += `6. Tailor your explanation to a ${detailLevel === '1' ? 'basic' : detailLevel === '2' ? 'intermediate' : 'advanced'} level of detail.\n`;
            
            if (provideExamples) {
                prompt += "7. Provide relevant real-world examples to illustrate key points.\n";
            }
            
            if (explainLikeIm3) {
                prompt += "8. Explain complex concepts in simple terms, as if explaining to a beginner.\n";
            } else {
                prompt += "8. Use appropriate technical language for a software engineering audience.\n";
            }
        } else {
            prompt += "Please provide detailed, professional advice for the following task:\n\n";
            prompt += `Task: ${task}\n\n`;
    
            Object.entries(fields).forEach(([key, value]) => {
                if (value) prompt += `${key.replace('-', ' ').toUpperCase()}:\n${value}\n\n`;
            });
    
            const taskPrompts = {
                'generate-ideas': [
                    "Based on the context and information provided, please:",
                    "1. Provide creative ideas and approaches to accomplish this goal or implement this central idea",
                    "2. Explain how each approach addresses or works within the given constraints",
                    "3. Explain the pros and cons of each approach",
                    "4. Suggest the most suitable solution and explain why",
                    "5. Provide any relevant best practices or considerations for implementation",
                    ...(provideCodeSnippet ? ["6. For each idea or approach, provide a code snippet that demonstrates the core concept or implementation"] : [])
                ],
                optimize: [
                    "Based on the code provided, please:",
                    "1. Identify areas for optimization in terms of performance, readability, and maintainability",
                    "2. Suggest specific changes to optimize the code",
                    "3. Explain the reasoning behind your optimization suggestions",
                    "4. Provide any relevant best practices or additional tips for optimization"
                ],
                debug: [
                    "Based on the information provided, please:",
                    "1. Identify potential issues in the code",
                    "2. Suggest solutions to resolve these issues",
                    "3. Explain the reasoning behind your suggestions",
                    "4. Provide any relevant best practices or optimization tips"
                ]
            };
    
            prompt += taskPrompts[task].join('\n');
    
            if (stepByStep && (task === 'debug' || task === 'generate-ideas')) {
                prompt += "\n\nPlease provide a step-by-step explanation of your thought process, clearly outlining each stage of your reasoning. This will help understand the logic behind your suggestions and how you arrived at your conclusions.";
            }
    
            prompt += "\n\nPlease provide a detailed response with explanations, code examples where appropriate, and any additional insights that would be valuable for a software engineer working on this task.";
    
            if (selfAssessment) {
                prompt += "\n\nAfter providing your response, please include a brief self-assessment. Rate your confidence in your answers on a scale of 1-10 and identify any potential limitations or areas where you're less certain. If applicable, mention any assumptions you made or additional information that would have been helpful to have.";
            }
    
            prompt += `\n\nPlease format your response as ${outputFormat === 'other' ? customFormat : outputFormat}.`;
        }
    
        return prompt;
    };

    const adjustLayout = () => {
        if (elements.rightPanel.classList.contains('hidden')) {
            elements.mainPanel.classList.remove('w-2/3');
            elements.mainPanel.classList.add('w-full', 'max-w-3xl', 'mx-auto');
            elements.container.classList.remove('max-w-7xl');
            elements.container.classList.add('max-w-3xl');
        } else {
            elements.mainPanel.classList.remove('w-full', 'max-w-3xl', 'mx-auto');
            elements.mainPanel.classList.add('w-2/3');
            elements.container.classList.remove('max-w-3xl');
            elements.container.classList.add('max-w-7xl');
        }
    };

    const handleGenerateClick = () => {
        const task = document.querySelector('input[name="task"]:checked').value;
        const outputFormat = task !== 'general' ? document.querySelector('input[name="output-format"]:checked').value : null;
        const customFormat = task !== 'general' ? elements.customFormatInput.value : null;
        const stepByStep = document.getElementById('step-by-step')?.checked ?? false;
        const selfAssessment = task !== 'general' ? document.getElementById('self-assessment')?.checked ?? false : false;
        const provideCodeSnippet = document.getElementById('provide-code-snippet')?.checked ?? false;
        const provideExamples = document.getElementById('provide-examples')?.checked ?? false;
        const explainLikeIm3 = document.getElementById('explain-like-im-3')?.checked ?? false;
        const detailLevel = document.getElementById('detail-level')?.value ?? '2';
        const fields = Array.from(elements.dynamicFields.querySelectorAll('input[type="text"], textarea'))
        .reduce((acc, field) => ({ ...acc, [field.id]: field.value }), {});
        
        elements.generateBtn.textContent = 'Generating...';
        elements.generateBtn.disabled = true;

        setTimeout(() => {
            const generatedPrompt = generatePrompt({ 
                task, 
                outputFormat, 
                customFormat, 
                stepByStep, 
                selfAssessment, 
                provideCodeSnippet,
                provideExamples,
                explainLikeIm3,
                detailLevel,
                ...fields 
            });
            elements.generatedPrompt.textContent = generatedPrompt;
            elements.rightPanel.classList.remove('hidden');
            adjustLayout();
    
            elements.generateBtn.textContent = 'Generate Prompt';
            elements.generateBtn.disabled = false;
        }, 1000);
    };

    const copyToClipboard = (text) => {
        return navigator.clipboard.writeText(text);
    };
    
    const openAIService = (url) => {
        window.open(url, '_blank');
    };
    
    const handleCopyAndOpen = (aiService) => {
        const promptText = elements.generatedPrompt.textContent;
        copyToClipboard(promptText)
            .then(() => {
                switch(aiService) {
                    case 'perplexity':
                        openAIService('https://www.perplexity.ai');
                        break;
                    case 'claude':
                        openAIService('https://claude.ai');
                        break;
                    case 'chatgpt':
                        openAIService('https://chat.openai.com');
                        break;
                }
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    };

    const handleCloseClick = () => {
        elements.rightPanel.classList.add('hidden');
        adjustLayout();
    };

    const initializeApp = () => {
        updateDynamicFields('general');
        adjustLayout();
    };

    // Event Listeners
    elements.taskRadios.forEach(radio => {
        radio.addEventListener('change', (e) => updateDynamicFields(e.target.value));
    });

    elements.outputFormatRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            elements.customFormatInput.style.display = e.target.value === 'other' ? 'block' : 'none';
        });
    });

    elements.generateBtn.addEventListener('click', handleGenerateClick);
    document.getElementById('copy-open-perplexity').addEventListener('click', () => handleCopyAndOpen('perplexity'));
    document.getElementById('copy-open-claude').addEventListener('click', () => handleCopyAndOpen('claude'));
    document.getElementById('copy-open-chatgpt').addEventListener('click', () => handleCopyAndOpen('chatgpt'));

    elements.closeBtn.addEventListener('click', handleCloseClick);

    initializeApp();
});