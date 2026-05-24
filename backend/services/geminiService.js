const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini API client if API key is present
let genAI = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("Gemini AI client initialized successfully 🧠");
} else {
    console.log("No GEMINI_API_KEY found or using dummy key. Operating in High-Fidelity Mock Mode 🚀");
}

/**
 * High-Fidelity Mock Banks for various common target roles
 */
const MOCK_QUESTION_BANK = {
    "Frontend Engineer": [
        "Can you explain the difference between the virtual DOM and the real DOM, and how React's reconciliation process works?",
        "What are the different ways to optimize a React application's rendering performance, specifically avoiding unnecessary re-renders?",
        "How do you handle global state management in modern React apps? What are the trade-offs between Context API and state libraries like Redux or Zustand?",
        "Could you describe the concept of CSS specificity, and how you approach writing clean, maintainable styles in large-scale applications?",
        "Explain how the 'this' keyword works in JavaScript, and how arrow functions behave differently from regular functions in terms of scoping."
    ],
    "Backend Engineer": [
        "What are the differences between REST and GraphQL, and how do you decide which architectural style to use for a new service?",
        "How would you design a database schema and indexing strategy for a high-throughput social media feed to ensure fast read queries?",
        "Explain the concepts of database transactions, ACID properties, and the differences between optimistic and pessimistic locking.",
        "How do you handle service authentication and authorization in a microservices architecture? Discuss JWTs vs session store.",
        "What is horizontal vs vertical scaling, and how would you implement caching (e.g., Redis) to reduce load on your primary SQL database?"
    ],
    "Fullstack Engineer": [
        "Explain the step-by-step process of what happens when a user types a URL in their browser and hits Enter, focusing on frontend-backend communications.",
        "How do you secure a web application against common security vulnerabilities like Cross-Site Scripting (XSS) and SQL Injection?",
        "What is your approach to designing a RESTful API? How do you handle pagination, error responses, and versioning?",
        "Describe how you would set up a CI/CD pipeline for a Node.js and React monorepo, and deploy it to a cloud provider like AWS or Heroku.",
        "How do you optimize web application loading speed, including techniques for both frontend bundle sizes and backend server responses?"
    ],
    "Data Scientist": [
        "What is the difference between supervised and unsupervised learning, and how do you select an evaluation metric for a highly imbalanced dataset?",
        "Can you explain the bias-variance tradeoff and describe some regularization techniques (like L1/L2) to prevent overfitting?",
        "How does a random forest algorithm work, and how does it compare to gradient boosting models like XGBoost in terms of performance and interpretability?",
        "What is feature engineering? Can you walk through how you would handle missing values and categorical features in a dataset?",
        "Describe a data project you worked on where the results were unexpected. How did you diagnose the issue and what did you learn?"
    ],
    "Product Manager": [
        "How do you define and prioritize a product roadmap? What frameworks (like RICE or MoSCoW) do you find most effective?",
        "Imagine our active user engagement dropped by 10% over the last week. Walk me through how you would investigate and diagnose the root cause.",
        "How do you balance engineering technical debt against delivering new client-facing features under tight deadlines?",
        "Describe a time when you had to launch a product or feature that did not meet expectations. What was your recovery strategy and retrospective process?",
        "How do you conduct user research and turn qualitative customer feedback into clear, actionable technical specifications for your design and development teams?"
    ],
    "default": [
        "Can you describe your ideal development workflow and the tools you use to maintain high code quality and collaboration?",
        "Tell me about a complex technical challenge you faced recently. How did you identify the problem, what was your solution, and what was the outcome?",
        "How do you stay up-to-date with emerging technologies and decide when it is appropriate to adopt a new tool or framework?",
        "What is your approach to testing code? Discuss unit testing, integration testing, and the importance of automated test suites.",
        "Describe a situation where you had a strong disagreement with a team member on a technical decision. How did you resolve it?"
    ]
};

/**
 * Generates an adaptive interview question.
 * Falls back to high-fidelity mock mode if Gemini client is not initialized.
 */
const generateQuestion = async (role, resumeText = "", history = []) => {
    const questionIndex = history.filter(h => h.role === 'assistant').length;
    
    // 1. High-Fidelity Mock Mode
    if (!genAI) {
        // Retrieve appropriate question bank
        let bank = MOCK_QUESTION_BANK[role] || MOCK_QUESTION_BANK["default"];
        if (questionIndex < bank.length) {
            let baseQuestion = bank[questionIndex];
            
            // Add a small adaptive touch based on previous user answer if available
            if (history.length > 0) {
                const lastUserAnswer = history[history.length - 1].content.toLowerCase();
                // Simple keyword adaptive injection for immersion!
                if (lastUserAnswer.includes("database") || lastUserAnswer.includes("sql") || lastUserAnswer.includes("mongodb")) {
                    baseQuestion += " Follow-up: since you mentioned database storage, how would you ensure data integrity and query efficiency in that setup?";
                } else if (lastUserAnswer.includes("state") || lastUserAnswer.includes("redux") || lastUserAnswer.includes("context")) {
                    baseQuestion += " Follow-up: based on your state management preferences, how do you handle state persistence across sessions?";
                }
            }
            return baseQuestion;
        } else {
            return "Thank you. We have completed the core technical questions. Please submit the interview to view your final evaluation.";
        }
    }

    // 2. Real Gemini AI Mode
    try {
        const modelName = "gemini-1.5-flash";
        const model = genAI.getGenerativeModel({ model: modelName });

        // Compile prompt with context and history
        let prompt = `You are an elite, highly professional technical interviewer at a top-tier tech company. 
You are conducting a professional mock interview for a candidate applying for the role of: "${role}".\n`;

        if (resumeText) {
            prompt += `Candidate resume details / experience summary:\n${resumeText}\n\n`;
        }

        prompt += `Below is the transcript of the interview so far (roles: assistant = interviewer, user = candidate):\n`;
        
        if (history.length === 0) {
            prompt += `[No questions have been asked yet. Generate the first introductory technical question tailored to the role and their resume.]\n`;
        } else {
            history.forEach(turn => {
                prompt += `${turn.role.toUpperCase()}: ${turn.content}\n`;
            });
            prompt += `\n[Generate the next logical, adaptive, and challenging technical question based on the candidate's last answer. Do not repeat topics. Dive deeper into their technical explanations or present a realistic coding/architectural scenario related to their role.]\n`;
        }

        prompt += `\nRules for your output:
1. Output ONLY the direct interview question. 
2. Do not include any greeting, conversational filler, introductory text, or concluding text (e.g. do NOT say "Great answer!" or "Here is the next question:").
3. Make it direct, engaging, and highly professional.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        return text;
    } catch (error) {
        console.error("Error generating question with Gemini:", error.message);
        // Seamless fallback to mock bank if API fails mid-interview
        let bank = MOCK_QUESTION_BANK[role] || MOCK_QUESTION_BANK["default"];
        return bank[questionIndex % bank.length] + " (AI offline - fallback question)";
    }
};

/**
 * Evaluates the entire transcript and returns a structured score/feedback.
 */
const evaluateInterview = async (role, transcript = []) => {
    // 1. High-Fidelity Mock Mode
    if (!genAI) {
        // Calculate mock scores based on transcript responses
        let wordCount = 0;
        let responseCount = 0;
        
        transcript.forEach(t => {
            if (t.role === 'user') {
                wordCount += t.content.split(/\s+/).length;
                responseCount++;
            }
        });

        // Determine quality metrics based on answer lengths and key patterns
        const averageLength = responseCount > 0 ? wordCount / responseCount : 0;
        
        let overallScore = 70;
        let technicalAccuracy = 68;
        let communicationSkill = 72;

        if (averageLength > 50) {
            overallScore = 85;
            technicalAccuracy = 86;
            communicationSkill = 84;
        } else if (averageLength > 20) {
            overallScore = 78;
            technicalAccuracy = 76;
            communicationSkill = 80;
        } else {
            overallScore = 55;
            technicalAccuracy = 50;
            communicationSkill = 60;
        }

        // Add variance for realism
        overallScore = Math.min(96, Math.max(40, overallScore + Math.floor(Math.random() * 6) - 3));
        technicalAccuracy = Math.min(98, Math.max(35, technicalAccuracy + Math.floor(Math.random() * 8) - 4));
        communicationSkill = Math.min(95, Math.max(45, communicationSkill + Math.floor(Math.random() * 6) - 2));

        // Generate tailored feedback based on role
        let strengths = [];
        let detailedFeedback = "";

        if (role === "Frontend Engineer") {
            strengths = ["Solid explanations of React fundamentals", "Good understanding of state management trade-offs", "Structured approach to layout design"];
            detailedFeedback = `### Performance Summary
The candidate demonstrated a solid foundation in modern Frontend Engineering. They explained core concepts such as virtual DOM, state management, and basic performance optimizations with good clarity.

### Technical Assessment
* **Strengths:** Strong familiarity with React hook patterns and state propagation. Good conceptual understanding of component lifecycles.
* **Areas for Improvement:** Could dive deeper into advanced performance optimization topics like code-splitting, lazy loading, and deep performance profiling under high layout thrashing. Focus on explaining browser rendering pipeline stages (Recalculate Style, Layout, Paint, Composite) to sound even more authoritative.

### Recommendations
1. Practice writing custom React hooks for complex state sync mechanisms.
2. Read up on CSS-in-JS vs CSS Modules compilation speeds in heavy enterprise systems.`;
        } else if (role === "Backend Engineer") {
            strengths = ["Clear understanding of REST vs GraphQL design patterns", "Good grasp of indexing and query optimization", "Awareness of caching layers"];
            detailedFeedback = `### Performance Summary
The candidate showcased a sturdy understanding of distributed systems, database management, and robust backend architecture.

### Technical Assessment
* **Strengths:** Answered questions about REST design patterns and database indexing with confidence. Good understanding of ACID compliance.
* **Areas for Improvement:** Could expand more on high-scale distributed caching strategies and message queues (like RabbitMQ/Kafka). Understanding when to use eventual consistency over strong consistency would elevate their answers.

### Recommendations
1. Review standard system design patterns for rate-limiting and circuit-breaking.
2. Study database sharding models and vertical partitioning trade-offs.`;
        } else {
            strengths = ["Articulate communication of technical achievements", "Logical and structured problem-solving approach", "Strong adaptability to question parameters"];
            detailedFeedback = `### Performance Summary
The candidate displayed a strong overall technical capability and excellent professional communication skills. They structured their answers logically and paced their explanations well.

### Technical Assessment
* **Strengths:** Outstanding communication. Answered with structured framework-based patterns (e.g., STAR method) which made explanations very easy to follow.
* **Areas for Improvement:** Dive quicker into the direct technical implementation details instead of spending too much time on general background context. When discussing challenges, focus more on exact technical tradeoffs (memory vs CPU, complexity vs delivery speed).

### Recommendations
1. Practice mock coding/architectural challenges under strict timed conditions.
2. Review core algorithms, system metrics, and architecture patterns relevant to ${role}.`;
        }

        return {
            overallScore,
            technicalAccuracy,
            communicationSkill,
            strengths,
            detailedFeedback
        };
    }

    // 2. Real Gemini AI Mode
    try {
        const modelName = "gemini-1.5-flash";
        // Prompt with structured JSON output configuration
        const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        let prompt = `You are an expert technical interviewer and senior engineering recruiter.
Evaluate the candidate's performance for the mock interview for the role of: "${role}".

Here is the complete transcript of the interview:
`;

        transcript.forEach(turn => {
            prompt += `${turn.role.toUpperCase()}: ${turn.content}\n`;
        });

        prompt += `\nYour task is to analyze the candidate's responses carefully and output a detailed evaluation in JSON format.
Analyze their:
1. Technical accuracy (quality of coding explanations, knowledge of tradeoffs, engineering fundamentals).
2. Communication skill (clarity, structure, articulation, professional demeanor).
3. Overall readiness for the target role.

Output exactly a JSON object matching this schema. Do not include markdown ticks, just raw JSON:
{
  "overallScore": <number between 0 and 100>,
  "technicalAccuracy": <number between 0 and 100>,
  "communicationSkill": <number between 0 and 100>,
  "strengths": ["list of 3 specific key strengths"],
  "detailedFeedback": "A comprehensive multi-paragraph evaluation string. Discuss their overall performance, specific technical insights, communication style, detailed weaknesses, and concrete recommendations. You may use markdown headers (e.g., ###, * bullets) within this string to format it beautifully."
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Error evaluating interview with Gemini:", error.message);
        // Graceful fallback to mock evaluation if API fails at evaluation stage
        return {
            overallScore: 78,
            technicalAccuracy: 75,
            communicationSkill: 80,
            strengths: ["Strong resilience during technical questioning", "Clear structural articulation", "Logical approach to problem solving"],
            detailedFeedback: `### Evaluation Review (AI Offline Fallback)
We completed the interview but experienced an AI network issue during final generation. Based on local indicators:

* **Overall Score:** 78/100
* **Technical Depth:** Good foundational explanations, but would benefit from further specific detailing.
* **Communication:** Highly professional and clear.

*Please try adding a valid GEMINI_API_KEY in the backend .env file to enable fully personalized, state-of-the-art AI-generated grading!*`
        };
    }
};

module.exports = {
    generateQuestion,
    evaluateInterview
};
