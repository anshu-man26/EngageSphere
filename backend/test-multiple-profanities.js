import dotenv from 'dotenv';
import profanityFilterService from './services/profanityFilterService.js';

dotenv.config();

const testCases = [
    // English profanities
    { text: "fuck", expected: "high" },
    { text: "motherfucker", expected: "high" },
    { text: "shit", expected: "high" },
    { text: "bitch", expected: "high" },
    { text: "asshole", expected: "high" },
    { text: "cunt", expected: "high" },
    { text: "dick", expected: "high" },
    { text: "pussy", expected: "high" },
    { text: "cock", expected: "high" },
    { text: "whore", expected: "high" },
    { text: "slut", expected: "high" },
    { text: "nigger", expected: "very high" },
    { text: "nigga", expected: "very high" },
    { text: "faggot", expected: "very high" },
    { text: "retard", expected: "medium" },
    
    // Hindi profanities
    { text: "madarchod", expected: "high" },
    { text: "behenchod", expected: "high" },
    { text: "bhosadike", expected: "high" },
    { text: "chutiya", expected: "medium" },
    { text: "harami", expected: "medium" },
    { text: "randi", expected: "high" },
    { text: "saala", expected: "medium" },
    { text: "saali", expected: "medium" },
    
    // Mixed/obfuscated
    { text: "f*ck", expected: "high" },
    { text: "f u c k", expected: "high" },
    { text: "n1gger", expected: "very high" },
    { text: "n!gger", expected: "very high" },
    
    // Normal/clean messages
    { text: "hello how are you", expected: "low" },
    { text: "you are an idiot", expected: "medium" },
    { text: "I hate you", expected: "medium" },
    { text: "you are stupid", expected: "medium" },
    { text: "damn it", expected: "low" },
    { text: "hell no", expected: "low" },
];

async function testProfanities() {
    console.log('🧪 Testing Multiple Profanities to Determine Optimal Threshold...\n');
    
    const results = [];
    
    for (const testCase of testCases) {
        try {
            const result = await profanityFilterService.filterMessage(testCase.text);
            const scores = result.analysis;
            
            const maxScore = Math.max(
                scores.profanityScore || 0,
                scores.toxicityScore || 0,
                scores.severeToxicityScore || 0,
                scores.insultScore || 0,
                scores.identityAttackScore || 0
            );
            
            results.push({
                text: testCase.text,
                expected: testCase.expected,
                maxScore: maxScore,
                profanity: scores.profanityScore || 0,
                toxicity: scores.toxicityScore || 0,
                severe: scores.severeToxicityScore || 0,
                insult: scores.insultScore || 0,
                identity: scores.identityAttackScore || 0,
                isFiltered: result.isFiltered
            });
            
            console.log(`"${testCase.text}" - Max: ${maxScore.toFixed(3)} | Expected: ${testCase.expected} | Filtered: ${result.isFiltered}`);
            
        } catch (error) {
            console.error(`Error testing "${testCase.text}":`, error.message);
        }
    }
    
    // Analyze results
    console.log('\n📊 ANALYSIS:');
    console.log('='.repeat(60));
    
    const highProfanity = results.filter(r => r.expected === 'high' || r.expected === 'very high');
    const mediumProfanity = results.filter(r => r.expected === 'medium');
    const lowProfanity = results.filter(r => r.expected === 'low');
    
    console.log('\n🔴 HIGH/VERY HIGH Profanity Scores:');
    highProfanity.forEach(r => {
        console.log(`"${r.text}": ${r.maxScore.toFixed(3)} (Prof: ${r.profanity.toFixed(3)}, Tox: ${r.toxicity.toFixed(3)}, Insult: ${r.insult.toFixed(3)}, Identity: ${r.identity.toFixed(3)})`);
    });
    
    console.log('\n🟡 MEDIUM Profanity Scores:');
    mediumProfanity.forEach(r => {
        console.log(`"${r.text}": ${r.maxScore.toFixed(3)} (Prof: ${r.profanity.toFixed(3)}, Tox: ${r.toxicity.toFixed(3)}, Insult: ${r.insult.toFixed(3)}, Identity: ${r.identity.toFixed(3)})`);
    });
    
    console.log('\n🟢 LOW Profanity Scores:');
    lowProfanity.forEach(r => {
        console.log(`"${r.text}": ${r.maxScore.toFixed(3)} (Prof: ${r.profanity.toFixed(3)}, Tox: ${r.toxicity.toFixed(3)}, Insult: ${r.insult.toFixed(3)}, Identity: ${r.identity.toFixed(3)})`);
    });
    
    // Calculate optimal threshold
    const highScores = highProfanity.map(r => r.maxScore);
    const mediumScores = mediumProfanity.map(r => r.maxScore);
    const lowScores = lowProfanity.map(r => r.maxScore);
    
    const minHighScore = Math.min(...highScores);
    const maxMediumScore = Math.max(...mediumScores);
    const maxLowScore = Math.max(...lowScores);
    
    console.log('\n🎯 THRESHOLD RECOMMENDATIONS:');
    console.log('='.repeat(60));
    console.log(`Minimum HIGH profanity score: ${minHighScore.toFixed(3)}`);
    console.log(`Maximum MEDIUM profanity score: ${maxMediumScore.toFixed(3)}`);
    console.log(`Maximum LOW profanity score: ${maxLowScore.toFixed(3)}`);
    
    console.log('\n💡 RECOMMENDED THRESHOLDS:');
    console.log(`- Conservative (catch most profanity): ${Math.min(minHighScore, 0.7).toFixed(2)}`);
    console.log(`- Balanced (current 0.9): 0.90`);
    console.log(`- Liberal (only extreme): ${Math.max(minHighScore, 0.8).toFixed(2)}`);
    
    console.log('\n📈 CURRENT THRESHOLD ANALYSIS:');
    const currentThreshold = 0.9;
    const highCaught = highProfanity.filter(r => r.maxScore > currentThreshold).length;
    const mediumCaught = mediumProfanity.filter(r => r.maxScore > currentThreshold).length;
    const lowCaught = lowProfanity.filter(r => r.maxScore > currentThreshold).length;
    
    console.log(`With threshold ${currentThreshold}:`);
    console.log(`- High profanity caught: ${highCaught}/${highProfanity.length} (${(highCaught/highProfanity.length*100).toFixed(1)}%)`);
    console.log(`- Medium profanity caught: ${mediumCaught}/${mediumProfanity.length} (${(mediumCaught/mediumProfanity.length*100).toFixed(1)}%)`);
    console.log(`- Low profanity caught: ${lowCaught}/${lowProfanity.length} (${(lowCaught/lowProfanity.length*100).toFixed(1)}%)`);
}

testProfanities(); 