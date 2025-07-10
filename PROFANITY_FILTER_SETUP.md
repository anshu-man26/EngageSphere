# Profanity Filter Setup Guide

This guide explains how to set up and use the profanity filter feature in EngageSphere.

## Overview

The profanity filter uses Google's Perspective API to analyze message content and filter inappropriate text. It provides:

- **Real-time content analysis** using AI
- **User-level toggle** - Users can enable/disable the filter for their messages
- **Admin-level toggle** - Admins can enable/disable the feature globally
- **Multiple toxicity categories** - Toxicity, severe toxicity, identity attacks, insults, profanity, and threats

## Setup Instructions

### 1. Get Google Perspective API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Perspective API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Perspective API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

### 2. Add Environment Variable

Add the following to your `.env` file in the backend directory:

```env
API_KEY=your_api_key_here
```

### 3. Install Dependencies

The required packages are already installed:
- `googleapis` - For Google API client
- `perspective-api-client` - Alternative client (optional)

## How It Works

### Backend Integration

1. **ProfanityFilterService** (`backend/services/profanityFilterService.js`):
   - Analyzes text using Perspective API
   - Applies configurable thresholds
   - Censors inappropriate content

2. **Message Processing**:
   - Messages are analyzed before being saved
   - Filtered content is replaced with asterisks
   - Original message is preserved in database

3. **User Settings**:
   - Users can toggle the filter on/off in their profile
   - Setting is stored in user model

4. **Admin Controls**:
   - Admins can enable/disable the feature globally
   - Setting is stored in system settings

### Frontend Integration

1. **User Profile** (`frontend/src/pages/profile/Profile.jsx`):
   - Toggle switch in Chat Settings tab
   - Real-time updates to user preferences

2. **Admin Panel** (`frontend/src/components/admin/SystemSettingsPanel.jsx`):
   - Global feature toggle in System Settings
   - Affects all users when disabled

## Configuration

### Thresholds

You can adjust the toxicity thresholds in `backend/services/profanityFilterService.js`:

```javascript
const thresholds = {
    toxicity: 0.7,           // High toxicity
    severeToxicity: 0.6,     // Severe toxicity
    identityAttack: 0.6,     // Identity attacks
    insult: 0.7,             // Insults
    profanity: 0.8,          // Profanity
    threat: 0.6              // Threats
};
```

### Censoring Logic

The censoring logic can be customized in the `censorMessage` method:

```javascript
censorMessage(message) {
    const censoredWords = [
        // Add custom words here
        'fuck', 'shit', 'bitch', 'ass', 'damn', 'hell',
    ];
    
    let censoredMessage = message;
    censoredWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        censoredMessage = censoredMessage.replace(regex, '*'.repeat(word.length));
    });
    
    return censoredMessage;
}
```

## Usage

### For Users

1. Go to Profile Settings > Chat Settings
2. Toggle "Profanity Filter" on/off
3. Changes apply immediately to new messages

### For Admins

1. Go to Admin Dashboard > System Settings
2. Toggle "Profanity Filter" feature on/off
3. When disabled, no messages are filtered regardless of user settings

## API Endpoints

### User Settings
- `PUT /api/users/profanity-filter-settings` - Update user's profanity filter setting

### Admin Settings
- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings` - Update system settings (includes profanity filter toggle)

## Troubleshooting

### Common Issues

1. **API Key Not Found**:
   - Ensure `API_KEY` is set in environment variables
   - Check that the API key is valid and has Perspective API enabled

2. **Messages Not Being Filtered**:
   - Check if the feature is enabled globally (admin settings)
   - Check if the user has the filter enabled
   - Verify the API is responding correctly

3. **High API Costs**:
   - Adjust thresholds to be more restrictive
   - Consider implementing caching for repeated phrases
   - Monitor API usage in Google Cloud Console

### Debug Information

The service logs important information:
- Service initialization status
- API request errors
- Filtering decisions

Check the console logs for debugging information.

## Security Considerations

1. **API Key Security**: Never expose the API key in client-side code
2. **Rate Limiting**: Consider implementing rate limiting for API calls
3. **Data Privacy**: Messages are sent to Google for analysis - ensure compliance with privacy policies
4. **Fallback**: The system gracefully handles API failures without blocking messages

## Cost Considerations

- Google Perspective API has usage-based pricing
- Monitor usage in Google Cloud Console
- Consider implementing caching for common phrases
- Set up billing alerts to avoid unexpected charges

## Future Enhancements

Potential improvements:
- Local word-based filtering as fallback
- Caching of analysis results
- Custom word lists per organization
- Advanced censoring patterns
- User feedback on false positives/negatives 