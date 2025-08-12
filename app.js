// Application State Management
class InterviewApp {
    constructor() {
        this.currentPage = 'landing-page';
        this.currentQuestionIndex = 0;
        this.interviewData = {
            type: 'General',
            questionCount: 5,
            questions: [],
            responses: [],
            startTime: null,
            endTime: null
        };
        this.isRecording = false;
        this.recognition = null;
        this.speechSynthesis = window.speechSynthesis;
        this.currentTranscript = '';
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('Initializing Interview App...');
        
        // Small delay to ensure DOM is fully loaded
        setTimeout(() => {
            this.loadInterviewData();
            this.setupEventListeners();
            this.initSpeechRecognition();
            this.updateQuestionPreview();
            console.log('App initialized successfully');
        }, 100);
    }

    loadInterviewData() {
        // Load questions data from the provided JSON
        this.interviewTypes = {
            "Technical": {
                "questions": [
                    "Explain your approach to debugging complex software issues and walk me through a specific example.",
                    "Describe a challenging technical project you've worked on and how you overcame obstacles.",
                    "How do you ensure code quality and maintainability in your development process?",
                    "Tell me about a time you had to learn a new technology quickly for a project.",
                    "How do you approach system design and scalability considerations?"
                ],
                "description": "Focus on technical skills, problem-solving, and engineering experience"
            },
            "Behavioral": {
                "questions": [
                    "Tell me about yourself and your professional background.",
                    "Describe a time you overcame a significant challenge at work.",
                    "How do you handle working under pressure and tight deadlines?",
                    "Give me an example of when you had to work with a difficult team member.",
                    "Tell me about a time you failed and what you learned from it."
                ],
                "description": "Focus on soft skills, past experiences, and behavioral competencies"
            },
            "General": {
                "questions": [
                    "What motivates you in your career and daily work?",
                    "Where do you see yourself in 5 years professionally?",
                    "Why are you interested in this position and our company?",
                    "What are your greatest strengths and how do they benefit a team?",
                    "Describe your ideal work environment and company culture."
                ],
                "description": "Focus on career goals, motivation, and general fit"
            }
        };

        this.feedbackTemplates = {
            "excellent": {
                "scoreRange": [90, 100],
                "strengths": ["Clear and articulate communication", "Well-structured responses", "Strong examples and evidence", "Professional demeanor"],
                "improvements": ["Continue building on your excellent communication skills", "Consider adding more specific metrics where applicable"],
                "suggestions": ["You're interview-ready! Practice maintaining this level consistently", "Research company-specific questions for your target roles"]
            },
            "good": {
                "scoreRange": [80, 89],
                "strengths": ["Good communication skills", "Relevant experience shared", "Professional approach", "Clear understanding of questions"],
                "improvements": ["Add more specific examples to strengthen responses", "Consider structuring answers using the STAR method"],
                "suggestions": ["Practice with more challenging questions", "Work on concise storytelling techniques"]
            },
            "average": {
                "scoreRange": [70, 79],
                "strengths": ["Attempted all questions", "Shows potential", "Basic communication skills"],
                "improvements": ["Provide more detailed and specific examples", "Work on response structure and clarity", "Build confidence in delivery"],
                "suggestions": ["Practice common interview questions daily", "Record yourself to improve delivery", "Research the STAR method for behavioral questions"]
            }
        };
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Remove any existing listeners first
        this.removeAllEventListeners();
        
        // Landing page
        this.attachEventListener('start-interview-btn', 'click', () => {
            console.log('Start interview button clicked');
            this.navigateToPage('setup-page');
        });

        // Setup page
        this.attachEventListener('back-to-landing', 'click', () => {
            this.navigateToPage('landing-page');
        });

        this.attachEventListener('interview-type', 'change', (e) => {
            this.interviewData.type = e.target.value;
            this.updateQuestionPreview();
        });

        this.attachEventListener('question-count', 'change', (e) => {
            this.interviewData.questionCount = parseInt(e.target.value);
            this.updateQuestionPreview();
        });

        this.attachEventListener('mic-test-btn', 'click', () => {
            this.testMicrophone();
        });

        this.attachEventListener('begin-interview-btn', 'click', () => {
            this.startInterview();
        });

        // Interview page
        this.attachEventListener('record-btn', 'click', () => {
            this.toggleRecording();
        });

        this.attachEventListener('skip-question-btn', 'click', () => {
            this.skipQuestion();
        });

        this.attachEventListener('next-question-btn', 'click', () => {
            this.nextQuestion();
        });

        this.attachEventListener('end-interview-btn', 'click', () => {
            this.endInterview();
        });

        // Results page
        this.attachEventListener('start-new-interview', 'click', () => {
            this.resetInterview();
        });

        this.attachEventListener('view-detailed-analysis', 'click', () => {
            this.showDetailedAnalysis();
        });

        this.attachEventListener('save-results', 'click', () => {
            this.saveResults();
        });

        // Modal
        this.attachEventListener('close-modal', 'click', () => {
            this.closeModal();
        });

        const modal = document.getElementById('analysis-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        console.log('Event listeners setup complete');
    }

    attachEventListener(elementId, eventType, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(eventType, (e) => {
                e.preventDefault();
                e.stopPropagation();
                handler(e);
            });
            console.log(`Event listener attached to ${elementId}`);
        } else {
            console.warn(`Element ${elementId} not found for event listener`);
        }
    }

    removeAllEventListeners() {
        // Get all elements that might have listeners and clone them to remove listeners
        const elementsWithListeners = [
            'start-interview-btn', 'back-to-landing', 'interview-type', 'question-count',
            'mic-test-btn', 'begin-interview-btn', 'record-btn', 'skip-question-btn',
            'next-question-btn', 'end-interview-btn', 'start-new-interview',
            'view-detailed-analysis', 'save-results', 'close-modal'
        ];

        elementsWithListeners.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            }
        });
    }

    navigateToPage(pageId) {
        console.log(`Navigating from ${this.currentPage} to ${pageId}`);
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            targetPage.classList.add('page-transition');
            
            this.currentPage = pageId;
            console.log(`Successfully navigated to ${pageId}`);

            // Re-setup event listeners for the new page
            setTimeout(() => {
                this.setupEventListeners();
                targetPage.classList.remove('page-transition');
            }, 100);
        } else {
            console.error(`Page ${pageId} not found`);
        }
    }

    updateQuestionPreview() {
        const preview = document.getElementById('question-preview');
        if (!preview) return;
        
        const typeQuestions = this.interviewTypes[this.interviewData.type]?.questions || [];
        const questions = typeQuestions.slice(0, this.interviewData.questionCount);
        
        preview.innerHTML = questions.map((question, index) => `
            <div class="question-item">
                <span class="question-number">${index + 1}.</span>
                <span class="question-text">${question}</span>
            </div>
        `).join('');
    }

    async testMicrophone() {
        const micStatus = document.getElementById('mic-status');
        const beginBtn = document.getElementById('begin-interview-btn');
        
        if (!micStatus) return;
        
        try {
            micStatus.innerHTML = 'Testing microphone access...';
            micStatus.className = 'mic-status';
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStatus.innerHTML = '✅ Microphone access granted and working!';
            micStatus.className = 'mic-status success';
            
            if (beginBtn) {
                beginBtn.disabled = false;
                beginBtn.classList.remove('btn--disabled');
            }
            
            // Stop the stream
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            console.error('Microphone access error:', error);
            micStatus.innerHTML = '❌ Microphone access denied. Please allow microphone access to continue.';
            micStatus.className = 'mic-status error';
            
            if (beginBtn) {
                beginBtn.disabled = true;
                beginBtn.classList.add('btn--disabled');
            }
        }
    }

    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                this.updateTranscript(finalTranscript, interimTranscript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.handleRecognitionError(event.error);
            };

            this.recognition.onend = () => {
                console.log('Speech recognition ended');
                if (this.isRecording) {
                    setTimeout(() => {
                        if (this.isRecording) {
                            try {
                                this.recognition.start();
                            } catch (e) {
                                console.log('Could not restart recognition:', e);
                                this.stopRecording();
                            }
                        }
                    }, 100);
                }
            };
        } else {
            console.warn('Speech recognition not supported in this browser');
        }
    }

    handleRecognitionError(error) {
        const recordingStatus = document.getElementById('recording-status');
        if (recordingStatus) {
            switch (error) {
                case 'not-allowed':
                    recordingStatus.textContent = 'Microphone access denied. Please allow microphone access.';
                    break;
                case 'no-speech':
                    recordingStatus.textContent = 'No speech detected. Please try speaking louder.';
                    break;
                case 'network':
                    recordingStatus.textContent = 'Network error occurred. Please check your connection.';
                    break;
                default:
                    recordingStatus.textContent = 'Speech recognition error. Please try again.';
            }
        }
        this.stopRecording();
    }

    startInterview() {
        console.log('Starting interview...');
        this.interviewData.startTime = new Date();
        
        const typeQuestions = this.interviewTypes[this.interviewData.type]?.questions || [];
        this.interviewData.questions = typeQuestions.slice(0, this.interviewData.questionCount);
        this.interviewData.responses = new Array(this.interviewData.questionCount).fill('');
        this.currentQuestionIndex = 0;

        this.navigateToPage('interview-page');
        
        setTimeout(() => {
            this.displayCurrentQuestion();
            this.updateProgress();
        }, 300);
    }

    displayCurrentQuestion() {
        const questionElement = document.getElementById('current-question');
        if (!questionElement) return;
        
        const question = this.interviewData.questions[this.currentQuestionIndex];
        questionElement.textContent = question;
        
        setTimeout(() => {
            this.speakQuestion(question);
        }, 500);
    }

    speakQuestion(text) {
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            
            this.speechSynthesis.speak(utterance);
        }
    }

    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (!progressFill || !progressText) return;
        
        const progress = ((this.currentQuestionIndex + 1) / this.interviewData.questions.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `Question ${this.currentQuestionIndex + 1} of ${this.interviewData.questions.length}`;
    }

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    startRecording() {
        if (!this.recognition) {
            alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        this.isRecording = true;
        this.currentTranscript = '';
        
        const recordBtn = document.getElementById('record-btn');
        const recordingStatus = document.getElementById('recording-status');

        if (recordBtn) {
            recordBtn.classList.add('recording');
            const recordText = recordBtn.querySelector('.record-text');
            const recordIcon = recordBtn.querySelector('.record-icon');
            if (recordText) recordText.textContent = 'Recording...';
            if (recordIcon) recordIcon.textContent = '🔴';
        }
        
        if (recordingStatus) {
            recordingStatus.textContent = 'Recording your response... Click again to stop.';
        }

        this.animateWaveBars();

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            this.stopRecording();
        }
    }

    stopRecording() {
        this.isRecording = false;
        
        const recordBtn = document.getElementById('record-btn');
        const recordingStatus = document.getElementById('recording-status');
        const nextBtn = document.getElementById('next-question-btn');

        if (recordBtn) {
            recordBtn.classList.remove('recording');
            const recordText = recordBtn.querySelector('.record-text');
            const recordIcon = recordBtn.querySelector('.record-icon');
            if (recordText) recordText.textContent = 'Click to Answer';
            if (recordIcon) recordIcon.textContent = '🎤';
        }
        
        if (recordingStatus) {
            recordingStatus.textContent = 'Recording completed. Review your response below.';
        }

        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.error('Error stopping speech recognition:', error);
            }
        }

        if (nextBtn) {
            const hasResponse = this.interviewData.responses[this.currentQuestionIndex] && 
                               this.interviewData.responses[this.currentQuestionIndex].trim().length > 0;
            nextBtn.disabled = !hasResponse;
        }

        this.stopWaveAnimation();
    }

    animateWaveBars() {
        const waveBars = document.querySelectorAll('.wave-bar');
        waveBars.forEach(bar => {
            bar.classList.add('animate');
        });
    }

    stopWaveAnimation() {
        const waveBars = document.querySelectorAll('.wave-bar');
        waveBars.forEach(bar => {
            bar.classList.remove('animate');
        });
    }

    updateTranscript(finalTranscript, interimTranscript) {
        const transcriptElement = document.getElementById('live-transcript');
        if (!transcriptElement) return;
        
        const fullTranscript = this.currentTranscript + finalTranscript + interimTranscript;
        
        if (fullTranscript.trim()) {
            transcriptElement.textContent = fullTranscript;
            transcriptElement.classList.add('active');
        }

        if (finalTranscript.trim()) {
            this.currentTranscript += finalTranscript;
            this.interviewData.responses[this.currentQuestionIndex] = this.currentTranscript;
            
            const nextBtn = document.getElementById('next-question-btn');
            if (nextBtn) {
                nextBtn.disabled = false;
            }
        }
    }

    skipQuestion() {
        this.interviewData.responses[this.currentQuestionIndex] = 'Question skipped by candidate.';
        this.nextQuestion();
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex >= this.interviewData.questions.length) {
            this.completeInterview();
        } else {
            this.displayCurrentQuestion();
            this.updateProgress();
            this.resetQuestionState();
        }
    }

    resetQuestionState() {
        const transcript = document.getElementById('live-transcript');
        const nextBtn = document.getElementById('next-question-btn');
        const recordingStatus = document.getElementById('recording-status');
        
        this.currentTranscript = '';
        
        if (transcript) {
            transcript.textContent = 'Your speech will appear here...';
            transcript.classList.remove('active');
        }
        
        if (nextBtn) {
            nextBtn.disabled = true;
        }
        
        if (recordingStatus) {
            recordingStatus.textContent = 'Click the microphone to start recording your answer';
        }
    }

    endInterview() {
        if (confirm('Are you sure you want to end the interview? Your progress will be saved.')) {
            this.completeInterview();
        }
    }

    completeInterview() {
        this.interviewData.endTime = new Date();
        this.generateResults();
        this.navigateToPage('results-page');
    }

    generateResults() {
        const responses = this.interviewData.responses.filter(r => r && r !== 'Question skipped by candidate.');
        const analysis = this.generateMockAnalysis(responses);
        
        this.interviewData.analysis = analysis;
        
        setTimeout(() => {
            this.displayResults();
        }, 300);
    }

    generateMockAnalysis(responses) {
        const totalWords = responses.join(' ').split(' ').filter(w => w.length > 0).length;
        const avgResponseLength = totalWords / Math.max(responses.length, 1);
        
        let clarity = Math.min(95, Math.max(60, 65 + (avgResponseLength * 1.5)));
        let relevance = Math.min(90, Math.max(55, 60 + Math.random() * 25));
        let tone = Math.min(92, Math.max(70, 75 + Math.random() * 17));
        
        const overallScore = Math.round((clarity + relevance + tone) / 3);

        let category = 'average';
        if (overallScore >= 90) category = 'excellent';
        else if (overallScore >= 80) category = 'good';

        const template = this.feedbackTemplates[category];

        return {
            overallScore,
            clarity: Math.round(clarity),
            relevance: Math.round(relevance),
            tone: Math.round(tone),
            strengths: template.strengths.slice(0, 3),
            improvements: template.improvements.slice(0, 2),
            suggestions: template.suggestions,
            duration: Math.round((this.interviewData.endTime - this.interviewData.startTime) / 1000 / 60),
            totalWords,
            answeredQuestions: responses.length
        };
    }

    displayResults() {
        const analysis = this.interviewData.analysis;
        if (!analysis) return;
        
        const overallScoreEl = document.getElementById('overall-score');
        const clarityScoreEl = document.getElementById('clarity-score');
        const relevanceScoreEl = document.getElementById('relevance-score');
        const toneScoreEl = document.getElementById('tone-score');
        
        if (overallScoreEl) overallScoreEl.textContent = analysis.overallScore;
        if (clarityScoreEl) clarityScoreEl.textContent = `${analysis.clarity}/100`;
        if (relevanceScoreEl) relevanceScoreEl.textContent = `${analysis.relevance}/100`;
        if (toneScoreEl) toneScoreEl.textContent = `${analysis.tone}/100`;
        
        const clarityBar = document.getElementById('clarity-bar');
        const relevanceBar = document.getElementById('relevance-bar');
        const toneBar = document.getElementById('tone-bar');
        
        if (clarityBar) clarityBar.style.width = `${analysis.clarity}%`;
        if (relevanceBar) relevanceBar.style.width = `${analysis.relevance}%`;
        if (toneBar) toneBar.style.width = `${analysis.tone}%`;
        
        const strengthsList = document.getElementById('strengths-list');
        const improvementsList = document.getElementById('improvements-list');
        
        if (strengthsList) {
            strengthsList.innerHTML = analysis.strengths.map(strength => `<li>${strength}</li>`).join('');
        }
        
        if (improvementsList) {
            improvementsList.innerHTML = analysis.improvements.map(improvement => `<li>${improvement}</li>`).join('');
        }
        
        this.displayFullTranscript();
    }

    displayFullTranscript() {
        const transcriptContent = document.getElementById('full-transcript');
        if (!transcriptContent) return;
        
        const transcriptItems = this.interviewData.questions.map((question, index) => {
            const response = this.interviewData.responses[index] || 'No response recorded.';
            return `
                <div class="transcript-item">
                    <div class="transcript-question">
                        <strong>AI:</strong> ${question}
                    </div>
                    <div class="transcript-answer">
                        <strong>You:</strong> ${response}
                    </div>
                </div>
            `;
        }).join('');
        
        transcriptContent.innerHTML = transcriptItems;
    }

    showDetailedAnalysis() {
        const modal = document.getElementById('analysis-modal');
        const modalBody = document.getElementById('detailed-analysis-content');
        
        if (!modal || !modalBody) return;
        
        const analysis = this.interviewData.analysis;
        
        modalBody.innerHTML = `
            <div class="detailed-analysis">
                <div class="analysis-section">
                    <h4>Interview Summary</h4>
                    <p><strong>Duration:</strong> ${analysis.duration} minutes</p>
                    <p><strong>Interview Type:</strong> ${this.interviewData.type}</p>
                    <p><strong>Questions Answered:</strong> ${analysis.answeredQuestions} of ${this.interviewData.questions.length}</p>
                    <p><strong>Total Words Spoken:</strong> ${analysis.totalWords} words</p>
                    <p><strong>Average Response Length:</strong> ${Math.round(analysis.totalWords / analysis.answeredQuestions)} words</p>
                </div>
                
                <div class="analysis-section">
                    <h4>Performance Breakdown</h4>
                    <ul>
                        <li><strong>Communication Clarity (${analysis.clarity}/100):</strong> Your speech was clear and easy to understand throughout the interview.</li>
                        <li><strong>Content Relevance (${analysis.relevance}/100):</strong> Your responses addressed the questions with appropriate content.</li>
                        <li><strong>Professional Tone (${analysis.tone}/100):</strong> You maintained an appropriate professional demeanor.</li>
                    </ul>
                </div>
                
                <div class="analysis-section">
                    <h4>Recommendations for Improvement</h4>
                    <ul>
                        <li>Practice the STAR method (Situation, Task, Action, Result) for behavioral questions</li>
                        <li>Prepare 2-3 specific examples that demonstrate your key skills</li>
                        <li>Research the company thoroughly to provide more targeted responses</li>
                        <li>Practice speaking at a moderate pace with clear articulation</li>
                        <li>Work on structuring your responses with clear beginning, middle, and end</li>
                    </ul>
                </div>
                
                <div class="analysis-section">
                    <h4>Next Steps</h4>
                    <ul>
                        ${analysis.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    closeModal() {
        const modal = document.getElementById('analysis-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    saveResults() {
        const results = {
            date: new Date().toISOString(),
            interviewType: this.interviewData.type,
            overallScore: this.interviewData.analysis.overallScore,
            scores: {
                clarity: this.interviewData.analysis.clarity,
                relevance: this.interviewData.analysis.relevance,
                tone: this.interviewData.analysis.tone
            },
            questionsAnswered: this.interviewData.analysis.answeredQuestions,
            totalQuestions: this.interviewData.questions.length,
            duration: this.interviewData.analysis.duration,
            totalWords: this.interviewData.analysis.totalWords,
            strengths: this.interviewData.analysis.strengths,
            improvements: this.interviewData.analysis.improvements,
            transcript: this.interviewData.questions.map((q, i) => ({
                question: q,
                response: this.interviewData.responses[i] || 'No response recorded.'
            }))
        };
        
        const dataStr = JSON.stringify(results, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `interview-results-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.style.display = 'none';
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
        
        alert('Results saved successfully!');
    }

    resetInterview() {
        if (this.isRecording) {
            this.stopRecording();
        }
        
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
        
        this.currentQuestionIndex = 0;
        this.currentTranscript = '';
        this.interviewData = {
            type: 'General',
            questionCount: 5,
            questions: [],
            responses: [],
            startTime: null,
            endTime: null
        };
        
        const beginBtn = document.getElementById('begin-interview-btn');
        if (beginBtn) {
            beginBtn.disabled = true;
            beginBtn.classList.add('btn--disabled');
        }
        
        const micStatus = document.getElementById('mic-status');
        if (micStatus) {
            micStatus.innerHTML = '';
            micStatus.className = 'mic-status';
        }
        
        this.updateQuestionPreview();
        this.navigateToPage('landing-page');
    }
}

// Initialize the application
let app;

function initializeApp() {
    try {
        app = new InterviewApp();
        console.log('App instance created successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

window.addEventListener('beforeunload', (e) => {
    if (app && app.currentPage === 'interview-page' && app.isRecording) {
        e.preventDefault();
        e.returnValue = 'You have an active interview session. Are you sure you want to leave?';
    }
});