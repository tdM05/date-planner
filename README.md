# **TwoDo**

## About
TwoDo is an AI-powered scheduling that syncs calendars, finds mutual availability, and creates personalized date plans in 30 seconds. TwoDo eliminates the endless "idk, you decide" texts by automatically syncing both partners' calendars and generating AI-powered date suggestions based on your preferences, weather, and top-rated venues. Planning quality time has never been easier.

### Key Features
- Smart Calendar Sync: Automatically identifies mutual free time
- AI-Powered Suggestions: Claude AI generates personalized date ideas with explanations
- Intelligent Ranking: Top 3 date options ranked based on your unique circumstances
- Venue Details: Ratings, and addresses from Google Places
- Session History: Save and compare date ideas before deciding
- One-Tap Planning: Adds plans to both calendars simultaneously

## Getting Started
Currently, TwoDo is **deployed for Android** via APK download. 

For **iOS users**, the app can be tested by running it locally through Expo Go. Simply clone the repository, start the development server on your computer, and scan the QR code with your iPhone to launch the app.

### For Android Users
1. Go to Releases
2. Click on the tag v1.0.1-alpha
3. Download TwoDo_v2.apk
4. Install and run the app

### For iOS Users
#### Prerequisites
- Download **Expo Go** from the App Store
- Ensure your phone and computer are on the same WiFi network

#### Installation Steps
1. **Clone the repository**
   Open Terminal (Mac/Linux) or Command Prompt (Windows):
```bash
   git clone https://github.com/tdM05/TwoDo.git
   cd TwoDo
```
2. **Navigate to mobile directory and install dependencies**
```bash
   cd mobile
   npm install
```
3. **Start the Expo development server**
   
   Try the default method first:
```bash
   npx expo start
```
   
   **If the QR code doesn't work or connection fails**, use tunnel mode:
```bash
   npx expo start --tunnel
```
  > **Note**: Tunnel mode works better on university/restricted networks but may be slower. If you're on a simple home WiFi, the default method should work.

4. **Wait for QR code to appear** (1-2 minutes for tunnel mode, faster for default)

5. **Scan the QR code** with your iPhone camera

6. **Open in Expo Go** when prompted

7. **Wait for the app to download** to 100%

#### Troubleshooting
- **QR code won't scan?** Make sure you're using tunnel mode (`--tunnel` flag)
- **Stuck at loading?** Check that both devices are on the same WiFi network
- **Connection error?** Try restarting the Expo server with `npx expo start --tunnel --clear`

## How to Use The App
1. Sign Up & Connect Your Calendar
   Recommended: Sign up with Google to automatically sync your calendar
   Manual Entry: If you sign up manually, you'll need to sync your Google Calendar in the Profile tab after logging in
   > ⚠️ Note: TwoDo currently supports Google Calendar only.
   
2. Link with Your Partner
   Send an invitation link to your partner, OR Accept an invitation from your partner. Once connected, you can both see shared availability
   
3. Set Your Location & Preferences
   Tell us what you enjoy: cuisine types, activities, budget range
   These preferences help our AI generate better date suggestions
   
4. Get AI-Powered Suggestions
   Receive 3 ranked date ideas tailored to your schedule and preferences
   Each suggestion includes venue details, ratings, and an explanation of why it's a good fit to your schedule
   
5. Book Your Date
   Choose your favorite suggestion. Add it to both calendars with one tap. No manual entry needed!

## Contributing
This project was built for Toronto Anthropic AI Hacakthon.

## License
This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).



