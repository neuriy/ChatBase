//
//  NeuriyUIComponents.swift
//  NeuriySDK
//
//  SwiftUI UI-UX Design Kit for Xcode iOS Apps
//  Copyright © 2026 Neuriy AI. All rights reserved.
//

import SwiftUI

// MARK: - Neuriy Theme Design Tokens

public struct NeuriyTheme {
    public static let lightBackground = Color(red: 237/255, green: 237/255, blue: 237/255) // #ededed
    public static let darkBackground = Color(red: 18/255, green: 18/255, blue: 20/255)   // #121214
    public static let lightUserBubble = Color(red: 226/255, green: 226/255, blue: 224/255) // #e2e2e0
    public static let darkUserBubble = Color(red: 42/255, green: 42/255, blue: 44/255)   // #2a2a2c
    public static let cardCornerRadius: CGFloat = 28.0
}

// MARK: - Neuriy Animated AI Face View (SwiftUI)

public struct NeuriyAIFaceView: View {
    @State private var isFloating = false
    @State private var isBlinking = false
    
    public var isListening: Bool
    public var isSpeaking: Bool
    
    public init(isListening: Bool = false, isSpeaking: Bool = false) {
        self.isListening = isListening
        self.isSpeaking = isSpeaking
    }
    
    public var body: some View {
        ZStack {
            // Ambient Aura Glow
            if isListening || isSpeaking {
                Circle()
                    .fill(isSpeaking ? Color.amber.opacity(0.3) : Color.blue.opacity(0.3))
                    .frame(width: 180, height: 180)
                    .blur(radius: 30)
                    .scaleEffect(isListening ? 1.2 : 1.0)
                    .animation(Animation.easeInOut(duration: 1.0).repeatForever(autoreverses: true), value: isListening)
            }
            
            // Vector AI Face matching chat.neuriy.com (2 pill eyes + mouth dot)
            VStack(spacing: 12) {
                HStack(spacing: 24) {
                    // Left Eye Pill
                    Capsule()
                        .fill(Color.primary)
                        .frame(width: 18, height: 42)
                        .scaleEffect(y: isBlinking ? 0.08 : 1.0)
                    
                    // Right Eye Pill
                    Capsule()
                        .fill(Color.primary)
                        .frame(width: 18, height: 42)
                        .scaleEffect(y: isBlinking ? 0.08 : 1.0)
                }
                
                // Nose / Mouth Dot
                Capsule()
                    .fill(Color.primary)
                    .frame(width: 4, height: 9)
                    .scaleEffect(y: isSpeaking ? 2.0 : 1.0)
                    .animation(isSpeaking ? Animation.easeInOut(duration: 0.3).repeatForever(autoreverses: true) : .default, value: isSpeaking)
            }
            .offset(y: isFloating ? -12 : 0)
            .animation(Animation.easeInOut(duration: 2.8).repeatForever(autoreverses: true), value: isFloating)
            .onAppear {
                isFloating = true
                startBlinkTimer()
            }
        }
    }
    
    private func startBlinkTimer() {
        Timer.scheduledTimer(withTimeInterval: 3.5, repeats: true) { _ in
            withAnimation(.easeInOut(duration: 0.15)) {
                isBlinking = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                withAnimation(.easeInOut(duration: 0.15)) {
                    isBlinking = false
                }
            }
        }
    }
}

// MARK: - Neuriy Chat Bubble View (SwiftUI)

public struct NeuriyChatBubbleView: View {
    public let message: NeuriyMessage
    
    public init(message: NeuriyMessage) {
        self.message = message
    }
    
    public var body: some View {
        HStack {
            if message.sender == "user" {
                Spacer()
                Text(message.content)
                    .font(.system(size: 15, weight: .regular))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(NeuriyTheme.lightUserBubble)
                    .foregroundColor(.primary)
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    Text(message.content)
                        .font(.system(size: 15, weight: .regular))
                        .foregroundColor(.primary)
                        .multilineTextAlignment(.leading)
                }
                Spacer()
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 4)
    }
}
