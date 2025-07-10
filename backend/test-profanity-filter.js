import dotenv from 'dotenv';
import profanityFilterService from './services/profanityFilterService.js';

// Load environment variables
dotenv.config();

async function testProfanityFilter() {
    console.log('🧪 Testing Profanity Filter Service...');
    console.log('API_KEY available:', !!process.env.API_KEY);
    
    try {
        // Test with clean message
        console.log('\n📝 Testing clean message...');
        const cleanResult = await profanityFilterService.filterMessage('Hello, how are you today?');
        console.log('Clean message result:', {
            isFiltered: cleanResult.isFiltered,
            message: cleanResult.filteredMessage
        });
        
        // Test with mild insult (should NOT be filtered)
        console.log('\n📝 Testing mild insult...');
        const mildResult = await profanityFilterService.filterMessage('You are an idiot and I hate you');
        console.log('Mild insult result:', {
            isFiltered: mildResult.isFiltered,
            message: mildResult.filteredMessage,
            analysis: mildResult.analysis
        });
        
        // Test with vulgar content (should be filtered)
        console.log('\n📝 Testing vulgar content...');
        const vulgarResult = await profanityFilterService.filterMessage('You are a motherfucker and an asshole');
        console.log('Vulgar content result:', {
            isFiltered: vulgarResult.isFiltered,
            message: vulgarResult.filteredMessage,
            analysis: vulgarResult.analysis
        });

        // Test with Hindi profanity (should be filtered)
        console.log('\n📝 Testing Hindi profanity...');
        const hindiResult = await profanityFilterService.filterMessage('madarchod');
        console.log('Hindi profanity result:', {
            isFiltered: hindiResult.isFiltered,
            message: hindiResult.filteredMessage,
            analysis: hindiResult.analysis
        });
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testProfanityFilter(); 