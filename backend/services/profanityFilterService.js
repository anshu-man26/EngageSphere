import { google } from 'googleapis';

class ProfanityFilterService {
    constructor() {
        this.discoveryUrl = 'https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1';
    }

    get apiKey() {
        return process.env.API_KEY;
    }

    async analyzeText(text) {
        if (!this.apiKey) {
            console.warn('API_KEY not found in environment variables. Profanity filter will be disabled.');
            return {
                profanityScore: 0,
                error: 'API key not available'
            };
        }

        try {
            const client = await google.discoverAPI(this.discoveryUrl);
            const analyzeRequest = {
                comment: { text: text },
                requestedAttributes: { 
                    PROFANITY: {},
                    TOXICITY: {},
                    SEVERE_TOXICITY: {},
                    INSULT: {},
                    IDENTITY_ATTACK: {}
                },
                languages: ['en']
            };
            return new Promise((resolve, reject) => {
                client.comments.analyze(
                    {
                        key: this.apiKey,
                        resource: analyzeRequest,
                    },
                    (err, response) => {
                        if (err) {
                            console.error('Perspective API error:', err);
                            resolve({ profanityScore: 0, error: 'API request failed' });
                            return;
                        }
                        const data = response.data;
                        const profanityScore = data.attributeScores?.PROFANITY?.summaryScore?.value || 0;
                        const toxicityScore = data.attributeScores?.TOXICITY?.summaryScore?.value || 0;
                        const severeToxicityScore = data.attributeScores?.SEVERE_TOXICITY?.summaryScore?.value || 0;
                        const insultScore = data.attributeScores?.INSULT?.summaryScore?.value || 0;
                        const identityAttackScore = data.attributeScores?.IDENTITY_ATTACK?.summaryScore?.value || 0;
                        
                        console.log(`[ProfanityFilter] API Response - Profanity: ${profanityScore}, Toxicity: ${toxicityScore}, Severe: ${severeToxicityScore}, Insult: ${insultScore}, Identity: ${identityAttackScore}`);
                        
                        resolve({ 
                            profanityScore, 
                            toxicityScore,
                            severeToxicityScore,
                            insultScore,
                            identityAttackScore,
                            scores: { 
                                profanity: profanityScore,
                                toxicity: toxicityScore,
                                severeToxicity: severeToxicityScore,
                                insult: insultScore,
                                identityAttack: identityAttackScore
                            } 
                        });
                    }
                );
            });
        } catch (error) {
            console.error('Error analyzing text:', error);
            return { profanityScore: 0, error: 'Analysis failed' };
        }
    }

    async filterMessage(message, userSettings = {}) {
        if (userSettings.profanityFilterEnabled === false) {
            return {
                originalMessage: message,
                filteredMessage: message,
                isFiltered: false,
                reason: 'User disabled profanity filter'
            };
        }
        
        const analysis = await this.analyzeText(message);
        
        // Individual thresholds for each category based on test results
        const thresholds = {
            profanity: 0.7,        // Catches: fuck, shit, bitch, asshole, cunt, etc.
            toxicity: 0.8,         // Catches: very toxic content
            severeToxicity: 0.6,   // Catches: severe toxic content (lower threshold)
            insult: 0.8,           // Catches: very offensive insults only
            identityAttack: 0.6    // Catches: racial slurs, identity attacks (lower threshold)
        };
        
        const isToxic = analysis.profanityScore > thresholds.profanity || 
                       analysis.toxicityScore > thresholds.toxicity || 
                       analysis.severeToxicityScore > thresholds.severeToxicity || 
                       analysis.insultScore > thresholds.insult || 
                       analysis.identityAttackScore > thresholds.identityAttack;
        
        if (isToxic) {
            return {
                originalMessage: message,
                filteredMessage: 'Profanity detected',
                isFiltered: true,
                reason: 'Content flagged as inappropriate (API)',
                analysis: analysis
            };
        }
        
        return {
            originalMessage: message,
            filteredMessage: message,
            isFiltered: false,
            analysis: analysis
        };
    }
}

const profanityFilterService = new ProfanityFilterService();
export default profanityFilterService; 