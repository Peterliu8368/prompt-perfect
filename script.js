document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        dynamicFields: document.getElementById('dynamic-fields'),
        toggleOptions: document.getElementById('toggle-options'),
        taskRadios: document.querySelectorAll('input[name="task"]'),
        outputFormatRadios: document.querySelectorAll('input[name="output-format"]'),
        customFormatInput: document.getElementById('custom-format'),
        generateBtn: document.getElementById('generate-btn'),
        result: document.getElementById('result'),
        generatedPrompt: document.getElementById('generated-prompt'),
        copyBtn: document.getElementById('copy-btn')
    };

    const createHtmlElement = (tagName, attributes = {}, content = '') => {
        const element = document.createElement(tagName);
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        element.innerHTML = content;
        return element.outerHTML;
    };

    const createField = (id, label, type = 'text', placeholder = '', isOptional = false) => {
        const labelText = `${label}${isOptional ? ' (optional)' : ''}:`;
        const inputAttributes = {
            id,
            class: 'w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500',
            placeholder,
            ...(type !== 'textarea' ? { type } : { rows: '4' })
        };

        return `
            <div class="input-group mb-4">
                <label for="${id}" class="block text-sm font-medium text-gray-700 mb-1">${labelText}</label>
                ${createHtmlElement(type === 'textarea' ? 'textarea' : 'input', inputAttributes)}
            </div>
        `;
    };

    const createToggle = (id, label, isChecked = false, recommendation = '') => {
        const toggleAttributes = {
            type: 'checkbox',
            class: 'form-checkbox text-indigo-600',
            id,
            ...(isChecked ? { checked: '' } : {})
        };

        return `
            <div class="mb-2">
                <label class="inline-flex items-center cursor-pointer">
                    ${createHtmlElement('input', toggleAttributes)}
                    <span class="ml-2">${label}</span>
                    ${recommendation ? `<span class="ml-2 text-sm text-gray-500">(${recommendation})</span>` : ''}
                </label>
            </div>
        `;
    };

    const taskConfigs = {
        debug: {
            fields: [
                { id: 'error-message', label: 'Error Message', type: 'textarea', placeholder: 'Describe the error you\'re encountering' },
                { id: 'code-snippet', label: 'Code Snippet', type: 'textarea', placeholder: 'Paste your code here', isOptional: true }
            ],
            toggles: [
                { id: 'step-by-step', label: 'Enable Step-by-Step Thinking', isChecked: false, recommendation: 'recommended only for very complex tasks' }
            ]
        },
        'generate-ideas': {
            fields: [
                { id: 'tech-stack', label: 'Tech Stack' },
                { id: 'issues', label: 'Issues', type: 'textarea', placeholder: 'Describe the problem or feature you need ideas for' },
                { id: 'expected-behavior', label: 'Expected Behavior (requirements)', type: 'textarea', placeholder: 'Describe what you want to achieve' }
            ],
            toggles: [
                { id: 'provide-code-snippet', label: 'Provide Code Snippet', isChecked: true },
                { id: 'step-by-step', label: 'Enable Step-by-Step Thinking', isChecked: false, recommendation: 'recommended only for very complex tasks' }
            ]
        },
        optimize: {
            fields: [
                { id: 'code-snippet', label: 'Code Snippet', type: 'textarea', placeholder: 'Paste the code you want to optimize' }
            ],
            toggles: []
        }
    };

    const updateDynamicFields = (taskType) => {
        const config = taskConfigs[taskType];
        const fieldsHTML = config.fields.map(field => createField(field.id, field.label, field.type, field.placeholder, field.isOptional)).join('');
        const togglesHTML = [...config.toggles, { id: 'self-assessment', label: 'Enable AI Self-Assessment' }]
            .map(toggle => createToggle(toggle.id, toggle.label, toggle.isChecked, toggle.recommendation))
            .join('');

        elements.dynamicFields.innerHTML = fieldsHTML;
        elements.toggleOptions.innerHTML = togglesHTML;
    };

    const generatePrompt = (data) => {
        const { task, outputFormat, customFormat, stepByStep, selfAssessment, provideCodeSnippet, ...fields } = data;
        let prompt = "You are an expert software engineer with extensive experience in modern technologies and best practices. ";
        
        if (task === 'generate-ideas' && fields['tech-stack']) {
            prompt += `You are also an expert in ${fields['tech-stack']} with deep knowledge of its best practices and latest features. `;
        }
        
        prompt += "Please provide detailed, professional advice for the following task:\n\n";
        prompt += `Task: ${task}\n\n`;

        Object.entries(fields).forEach(([key, value]) => {
            if (value) prompt += `${key.replace('-', ' ').toUpperCase()}:\n${value}\n\n`;
        });

        const taskPrompts = {
            debug: [
                "Based on the information provided, please:",
                "1. Identify potential issues in the code",
                "2. Suggest solutions to resolve these issues",
                "3. Explain the reasoning behind your suggestions",
                "4. Provide any relevant best practices or optimization tips"
            ],
            'generate-ideas': [
                "Based on the information provided, please:",
                "1. Provide creative ideas and approaches to implement this feature or solve this problem",
                "2. Explain the pros and cons of each approach",
                "3. Suggest the most suitable solution and explain why",
                "4. Provide any relevant best practices or considerations for implementation",
                ...(provideCodeSnippet ? ["5. For each idea or approach, provide a code snippet that demonstrates the core concept or implementation"] : [])
            ],
            optimize: [
                "Based on the code provided, please:",
                "1. Identify areas for optimization in terms of performance, readability, and maintainability",
                "2. Suggest specific changes to optimize the code",
                "3. Explain the reasoning behind your optimization suggestions",
                "4. Provide any relevant best practices or additional tips for optimization"
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

        return prompt;
    };

    const handleGenerateClick = () => {
        const task = document.querySelector('input[name="task"]:checked').value;
        const outputFormat = document.querySelector('input[name="output-format"]:checked').value;
        const customFormat = elements.customFormatInput.value;
        const stepByStep = document.getElementById('step-by-step')?.checked ?? false;
        const selfAssessment = document.getElementById('self-assessment').checked;
        const provideCodeSnippet = document.getElementById('provide-code-snippet')?.checked ?? false;
        const fields = Array.from(elements.dynamicFields.querySelectorAll('input, textarea'))
            .reduce((acc, field) => ({ ...acc, [field.id]: field.value }), {});
        
        elements.generateBtn.textContent = 'Generating...';
        elements.generateBtn.disabled = true;

        setTimeout(() => {
            const generatedPrompt = generatePrompt({ task, outputFormat, customFormat, stepByStep, selfAssessment, provideCodeSnippet, ...fields });
            elements.generatedPrompt.textContent = generatedPrompt;
            elements.result.classList.remove('hidden');

            elements.generateBtn.textContent = 'Generate Prompt';
            elements.generateBtn.disabled = false;
        }, 1000);
    };

    const handleCopyClick = () => {
        navigator.clipboard.writeText(elements.generatedPrompt.textContent)
            .then(() => {
                elements.copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    elements.copyBtn.textContent = 'Copy';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
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
    elements.copyBtn.addEventListener('click', handleCopyClick);

    // Initialize with default task (debug)
    updateDynamicFields('debug');
});