import dotenv from 'dotenv';
import { google } from 'googleapis';

// Load environment variables
dotenv.config();

const API_KEY = process.env.API_KEY;
const DISCOVERY_URL = 'https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1';

console.log('🧪 Testing Perspective API directly...');
console.log('API_KEY available:', !!API_KEY);
console.log('API_KEY length:', API_KEY ? API_KEY.length : 'Not set');

if (!API_KEY) {
    console.error('❌ API_KEY not found in environment variables');
    process.exit(1);
}

google.discoverAPI(DISCOVERY_URL)
    .then(client => {
        console.log('✅ API client discovered successfully');
        
        const analyzeRequest = {
            comment: {
                text: 'Jiminy cricket! Well gosh durned it! Oh damn it all!',
            },
            requestedAttributes: {
                TOXICITY: {},
                SEVERE_TOXICITY: {},
                IDENTITY_ATTACK: {},
                INSULT: {},
                PROFANITY: {},
                THREAT: {}
            },
        };

        client.comments.analyze(
            {
                key: API_KEY,
                resource: analyzeRequest,
            },
            (err, response) => {
                if (err) {
                    console.error('❌ API Error:', err);
                    return;
                }
                console.log('✅ API Response received:');
                console.log(JSON.stringify(response.data, null, 2));
            });
    })
    .catch(err => {
        console.error('❌ Failed to discover API:', err);
    }); 