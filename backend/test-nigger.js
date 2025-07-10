import dotenv from 'dotenv';
import profanityFilterService from './services/profanityFilterService.js';

dotenv.config();

async function testNigger() {
    console.log('🧪 Testing profanity filter with "nigger"...');
    
    try {
        const result = await profanityFilterService.filterMessage('nigger');
        console.log('Result:', {
            isFiltered: result.isFiltered,
            reason: result.reason,
            message: result.filteredMessage,
            analysis: result.analysis
        });
        
        console.log('\n📋 Current censored words:', profanityFilterService.censoredWords);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testNigger(); 