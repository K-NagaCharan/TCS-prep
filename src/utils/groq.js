/**
 * API Wrapper for Groq Chat Completions
 */

const GROQ_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Validates a Groq API Key and Model by making a simple request
 * @param {string} apiKey 
 * @param {string} model 
 * @returns {Promise<boolean>}
 */
export async function testConnection(apiKey, model) {
  if (!apiKey) return false;
  
  try {
    const res = await fetch(GROQ_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say "connected" in one word' }],
        max_tokens: 10
      })
    });
    
    return res.status === 200;
  } catch (err) {
    console.error('Connection test failed:', err);
    return false;
  }
}

/**
 * Helper to call Groq API with retries for JSON parsing
 */
async function callGroqWithJsonRetry(apiKey, model, systemPrompt, userPrompt, temperature, maxRetries = 2) {
  let attempt = 0;
  let currentPrompt = userPrompt;
  
  while (attempt <= maxRetries) {
    try {
      const response = await fetch(GROQ_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: currentPrompt }
          ],
          temperature: temperature,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content;
      if (!rawText) {
        throw new Error('API returned empty content');
      }

      try {
        const parsedJson = JSON.parse(rawText);
        return parsedJson; // Successful parsing
      } catch (parseErr) {
        console.warn(`JSON parsing failed on attempt ${attempt + 1}:`, parseErr, 'Raw response:', rawText);
        attempt++;
        if (attempt > maxRetries) {
          throw new Error(`Failed to parse JSON response after ${maxRetries} retries: ${parseErr.message}`);
        }
        currentPrompt = `The previous response failed to parse as valid JSON. Error: ${parseErr.message}.\n\nPlease output ONLY valid, well-formed JSON matching the exact schema requested, with no markdown fences, no formatting code blocks, and no extra commentary.\n\nOriginal Request:\n${userPrompt}`;
      }
    } catch (err) {
      if (attempt >= maxRetries) {
        throw err;
      }
      console.warn(`Error on attempt ${attempt + 1}: ${err.message}. Retrying...`);
      attempt++;
    }
  }
}

/**
 * Generates a fresh mock paper (Key A)
 * @param {string} apiKey 
 * @param {string} model 
 * @param {Array<string>} recentExclusions - Topic tags/email scenarios to avoid
 * @returns {Promise<Object>} The parsed exam paper
 */
export async function generatePaper(apiKey, model, recentExclusions = []) {
  const seed = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  const systemPromptPart1 = `You are a question-paper setter for the TCS NQT Foundation Verbal Ability section (2026 pattern). Generate exactly 20 fresh sentence completion questions.

SEED: ${seed}

OUTPUT FORMAT: Return ONLY valid JSON, no markdown fences, no commentary, matching this exact schema:

{
  "sentence_completion": [
    {
      "id": 1,
      "sentence": "string with exactly one blank marked as ______",
      "difficulty": "basic | moderate | typical",
      "topic_tag": "e.g. workplace-vocab, idiom, analogy, collocation, tense-agreement",
      "acceptable_answers": ["primary answer", "close synonym 1", "close synonym 2"],
      "explanation": "one sentence on why this is correct, for later review"
    }
    // ... exactly 20 items, ids 1-20
  ]
}

STRICT CONTENT & VARIETY RULES:
1. Sentence completion: mix of vocabulary-in-context, collocations, idioms, analogies, tense/preposition agreement, and workplace-register word choice — matching real TCS NQT sentence-completion style.
2. Shuffled Difficulty: Roughly 40% basic, 40% moderate, 20% typical/harder, shuffled in order (don't cluster all hard ones together).
3. Context Variety: Each of the 20 questions MUST feature a scenario from a different corporate department or context from the list of 20 below. No two questions may share the same department context:
   - 1. Customer Support / Service
   - 2. Product Design / UX
   - 3. Software Development / Engineering
   - 4. Finance / Budgeting / Accounting
   - 5. Legal / Corporate Law
   - 6. Supply Chain / Logistics / Shipping
   - 7. Public Relations (PR) / Brand Image
   - 8. Cybersecurity / Network Security
   - 9. Corporate Strategy / Board Leadership
   - 10. Operations / Facilities / Office Management
   - 11. Procurement / Vendor Sourcing
   - 12. Sales / Account Management
   - 13. Quality Control / QA Testing
   - 14. Research & Development / R&D / Innovation
   - 15. Workplace Safety / Occupational Health
   - 16. Business Intelligence / Data Analytics
   - 17. Internal Audit / Regulatory Compliance
   - 18. Marketing / Social Media Campaign
   - 19. Human Resources (HR) / Recruitment / Employee Relations
   - 20. Project Management / Agile Operations
4. Structural Uniqueness: Do not repeat similar sentence patterns, subject phrases, or templates (e.g. do not repeat "The IT department is responsible for...", "The marketing team is looking for..."). Each sentence must be structurally, grammatically, and contextually distinct.
5. Answerability: Each sentence must be answerable in a single word or short phrase within 25 seconds by someone with intermediate English — no ambiguous blanks with many equally valid but unrelated answers.`;

  const systemPromptPart2 = `You are a question-paper setter for the TCS NQT Foundation Verbal Ability section (2026 pattern). Generate exactly 4 passage recall paragraphs and 1 email writing scenario.

SEED: ${seed}

OUTPUT FORMAT: Return ONLY valid JSON, no markdown fences, no commentary, matching this exact schema:

{
  "paper_id": "string, uuid",
  "passage_recall": [
    {
      "id": 21,
      "paragraph": "exactly 4-5 sentences, workplace/general-interest register, 90-130 words total",
      "key_points": ["point 1 that must survive a good rewrite", "point 2", "point 3", "point 4"]
    }
    // ... exactly 4 items, ids 21-24
  ],
  "email_writing": {
    "id": 25,
    "scenario": "2-4 workplace situation requiring a formal/professional email. The scenario must explicitly require the candidate to write an email of at least 100 to 150 words.",
    "recipient_role": "e.g. manager, HR, client, vendor",
    "required_elements": ["element the email must contain, e.g. a specific date", "a request", "a reason", "a polite close"],
    "tone": "formal | semi-formal"
  }
}

CONTENT RULES:
1. Passage recall paragraphs: self-contained, no external knowledge needed, written so a careful reader could reconstruct the gist (not exact wording) after one 30-second read. Ensure the word count is strictly between 90-130 words.
2. Email scenario: realistic corporate situations (delay notification, requesting leave/extension, escalating an issue, project handoff, thanking/following up, declining a request professionally). Do not repeat the same scenario type twice across calls if you can infer recent history from the seed. The scenario must explicitly require the candidate to write an email of at least 100 to 150 words.
3. Do not include any content unrelated to workplace/general-interest English; no coding, no domain-specific jargon requiring niche background knowledge.`;

  const userPromptPart1 = `Generate exactly 20 unique sentence completion questions. Adhere strictly to the 20 distinct contexts list. ${
    recentExclusions.length > 0
      ? `Avoid topics, scenarios, or correct answers related to or matching any of these specific terms/words: ${recentExclusions.join(', ')}.`
      : ''
  }`;

  const userPromptPart2 = `Generate exactly 4 passage recalls and 1 email scenario. ${
    recentExclusions.length > 0
      ? `Avoid topics, scenarios, or correct answers related to or matching any of these specific terms/words: ${recentExclusions.join(', ')}.`
      : ''
  }`;

  // Execute in parallel on Key A to save time
  const [part1, part2] = await Promise.all([
    callGroqWithJsonRetry(apiKey, model, systemPromptPart1, userPromptPart1, 0.9, 2),
    callGroqWithJsonRetry(apiKey, model, systemPromptPart2, userPromptPart2, 0.9, 2)
  ]);

  const paper = {
    paper_id: part2.paper_id || part1.paper_id || `${Date.now()}`,
    sentence_completion: part1.sentence_completion,
    passage_recall: part2.passage_recall,
    email_writing: part2.email_writing
  };

  // Validate basic schema integrity
  if (!paper.paper_id || !Array.isArray(paper.sentence_completion) || !Array.isArray(paper.passage_recall) || !paper.email_writing) {
    throw new Error('Generated paper does not conform to the required sections structure.');
  }
  
  if (paper.sentence_completion.length !== 20) {
    throw new Error(`Sentence completion section contains ${paper.sentence_completion.length} questions, expected exactly 20.`);
  }

  if (paper.passage_recall.length !== 4) {
    throw new Error(`Passage recall section contains ${paper.passage_recall.length} paragraphs, expected exactly 4.`);
  }
  
  return paper;
}

/**
 * Grades the candidate's answers using Key B (Evaluator)
 * @param {string} apiKey 
 * @param {string} model 
 * @param {Object} originalPaper - The source paper generated by Key A
 * @param {Object} candidateAnswers - The candidate's typed responses
 * @returns {Promise<Object>} The graded report JSON
 */
export async function evaluatePaper(apiKey, model, originalPaper, candidateAnswers) {
  // Trim the payload to save tokens and prevent leaked explanations/answers bias
  const trimmedSentenceCompletion = originalPaper.sentence_completion.map(q => ({
    id: q.id,
    sentence: q.sentence,
    acceptable_answers: q.acceptable_answers,
    user_answer: candidateAnswers.sentence_completion[q.id] || ""
  }));

  const trimmedPassageRecall = originalPaper.passage_recall.map(q => ({
    id: q.id,
    paragraph: q.paragraph,
    key_points: q.key_points,
    user_answer: candidateAnswers.passage_recall[q.id] || ""
  }));

  const trimmedEmail = {
    id: originalPaper.email_writing.id,
    scenario: originalPaper.email_writing.scenario,
    recipient_role: originalPaper.email_writing.recipient_role,
    required_elements: originalPaper.email_writing.required_elements,
    tone: originalPaper.email_writing.tone,
    user_answer: candidateAnswers.email_writing || ""
  };

  const payload = {
    paper_id: originalPaper.paper_id,
    sentence_completion: trimmedSentenceCompletion,
    passage_recall: trimmedPassageRecall,
    email_writing: trimmedEmail
  };

  const systemPrompt = `You are a strict but fair evaluator for TCS NQT Foundation Verbal Ability practice answers. You grade three question types with different rubrics. Return ONLY valid JSON, no commentary outside the JSON.

INPUT you will receive per call: the original question(s) plus the candidate's typed response(s). Grade exactly what's given — do not invent missing answers as blank, treat missing/empty responses as unattempted (0).

--- RUBRIC A: Sentence completion (per item) ---
- Compare the candidate's answer against \`acceptable_answers\` and general semantic fit — accept reasonable synonyms and minor spelling slips (e.g. one-letter typos) as correct if the word is unambiguous.
- Score: 1 (correct) or 0 (incorrect/unattempted). No partial credit.
- Give a one-line reason for the score.

--- RUBRIC B: Passage recall (per item) ---
Score 0-10 based on:
  - Coverage of \`key_points\` (how many of the 4 survived, in the candidate's own words) — weight 60%
  - Coherence and grammar of the rewrite — weight 25%
  - Should NOT be near-verbatim copying of the original if the original was somehow pasted in (flag as suspicious, cap score at 3) — weight 15% (penalty only, not a bonus)
Give 2-3 lines of specific feedback: what was retained, what was missed, one concrete improvement tip.

--- RUBRIC C: Email writing (single item) ---
Score 0-100 based on TCS-style workplace email criteria:
  - Correct formal structure: salutation, clear subject/purpose opening, body, polite closing, sign-off (25%)
  - Coverage of all \`required_elements\` from the scenario (30%)
  - Tone appropriateness (formal/semi-formal as specified) (15%)
  - Grammar, spelling, punctuation (15%)
  - Clarity, conciseness, and Word Count compliance (100-150 words) — penalize heavily if word count is under 100 or over 150 words (15%)
Give feedback as: 3-5 specific bullet points (what worked, what to fix), plus ONE rewritten example sentence for the weakest part of their email.
Also, you must provide a detailed_improvement_advice field which is a clear, context-rich analysis (100-150 words) explaining exactly how the candidate should rewrite their draft to achieve a perfect NQT standard, highlighting vocabulary suggestions, tone improvements, and grammatical correctness.

OUTPUT FORMAT:

{
  "sentence_completion_results": [
    { "id": 1, "score": 1, "verdict": "correct", "reason": "string" }
    // one per item received
  ],
  "passage_recall_results": [
    { "id": 21, "score": 7, "max_score": 10, "feedback": "string" }
  ],
  "email_result": {
    "id": 25,
    "score": 78,
    "max_score": 100,
    "breakdown": {
      "structure": 20, "coverage": 22, "tone": 13, "grammar": 12, "clarity": 11
    },
    "feedback_bullets": ["string", "string", "string"],
    "improved_example": "string, one rewritten sentence",
    "detailed_improvement_advice": "string, comprehensive analysis of how to improve"
  },
  "summary": {
    "sentence_completion_total": "x/20",
    "passage_recall_total": "x/40",
    "email_total": "x/100",
    "overall_note": "1-2 sentence honest, non-inflated assessment of readiness for the real exam"
  }
}

GRADING PHILOSOPHY:
- Be honest and calibrated, not encouraging-by-default. This is exam prep; inflated scores are actively harmful to the candidate's readiness.
- Never fabricate a score without checking the actual text given.
- If a response is empty or clearly gibberish/timeout-cut-off, score 0 and say so plainly rather than being generous.`;

  const userPrompt = `Here is the candidate's test payload to evaluate:\n\n${JSON.stringify(payload, null, 2)}`;

  // Use low temperature for grading consistency
  return await callGroqWithJsonRetry(apiKey, model, systemPrompt, userPrompt, 0.2, 2);
}
