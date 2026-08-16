# 🛠️ Neuriy AI iOS / Xcode SDK Kit & REST API Gateway

This SDK Kit provides a complete backend REST API Gateway and Swift UI/UX component library for integrating **Neuriy AI** (`chat.neuriy.com`) into Xcode iOS applications.

---

## 🌐 REST API Gateway Endpoints

Your Next.js server serves as the REST API Gateway:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Server health check and API status |
| `/api/models` | `GET` | List available Neuriy AI models (`pro`, `flash`, `reasoning`, `code`) |
| `/api/chat` | `POST` | Execute AI chat completions with options (web search, deep reasoning, models) |

### Example REST API Request (`POST /api/chat`)

```json
{
  "messages": [
    { "role": "user", "content": "How to optimize web application LCP?" }
  ],
  "model": "pro",
  "webSearch": true,
  "deepThink": true,
  "temperature": 0.7
}
```

---

## 📱 Xcode / Swift Integration

Add `NeuriySDK.swift` and `NeuriyUIComponents.swift` directly to your Xcode Swift target.

### 1. Initialize API Client

```swift
import SwiftUI
import NeuriySDK

let client = NeuriyClient(baseURL: URL(string: "http://localhost:3000")!)

// Send Chat Request async
Task {
    let response = try await client.sendMessage(
        messages: [NeuriyMessage(sender: "user", content: "Is contrast strong enough?")],
        model: "pro",
        webSearch: false
    )
    print("Neuriy Response:", response.reply)
}
```

### 2. Embed Interactive SwiftUI AI Face (`• . •`)

Use the SwiftUI `NeuriyAIFaceView` component inside any Xcode view:

```swift
struct ContentView: View {
    @State private var isListening = false
    @State private var isSpeaking = false
    
    var body: some View {
        VStack {
            // Interactive AI Face with Floating & Blinking Animations
            NeuriyAIFaceView(isListening: isListening, isSpeaking: isSpeaking)
                .frame(width: 200, height: 160)
        }
        .background(NeuriyTheme.lightBackground)
    }
}
```

---

## 🚀 Testing Endpoints Locally

- Health Check: `http://localhost:3000/api/health`
- Models List: `http://localhost:3000/api/models`
- Chat API: `http://localhost:3000/api/chat`
