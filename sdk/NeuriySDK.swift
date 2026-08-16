//
//  NeuriySDK.swift
//  NeuriySDK
//
//  Created for chat.neuriy.com Xcode iOS Apps
//  Copyright © 2026 Neuriy AI. All rights reserved.
//

import Foundation
import Combine

// MARK: - Data Models

public struct NeuriyMessage: Identifiable, Codable, Equatable {
    public let id: String
    public let sender: String // "user" or "assistant"
    public let content: String
    public let timestamp: Date
    
    public init(id: String = UUID().uuidString, sender: String, content: String, timestamp: Date = Date()) {
        this_init(id: id, sender: sender, content: content, timestamp: timestamp)
    }
    
    private init(this_init id: String, sender: String, content: String, timestamp: Date) {
        self.id = id
        self.sender = sender
        self.content = content
        self.timestamp = timestamp
    }
}

public struct NeuriyModel: Identifiable, Codable {
    public let id: String
    public let name: String
    public let description: String
    public let category: String
    public let recommended: Bool?
}

public struct NeuriyChatRequest: Codable {
    public let messages: [NeuriyApiMessage]
    public let model: String
    public let webSearch: Bool
    public let deepThink: Bool
    public let temperature: Double
    
    public struct NeuriyApiMessage: Codable {
        public let role: String
        public let content: String
        
        public init(role: String, content: String) {
            self.role = role
            self.content = content
        }
    }
    
    public init(messages: [NeuriyMessage], model: String = "pro", webSearch: Bool = false, deepThink: Bool = false, temperature: Double = 0.7) {
        self.messages = messages.map { NeuriyApiMessage(role: $0.sender, content: $0.content) }
        self.model = model
        self.webSearch = webSearch
        self.deepThink = deepThink
        self.temperature = temperature
    }
}

public struct NeuriyChatResponse: Codable {
    public let id: String
    public let reply: String
    public let model: String
    public let webSearchUsed: Bool?
    public let deepThinkUsed: Bool?
    public let timestamp: String
}

// MARK: - Neuriy API Client

public class NeuriyClient: ObservableObject {
    public let baseURL: URL
    private let session: URLSession
    
    public init(baseURL: URL = URL(string: "http://localhost:3000")!) {
        self.baseURL = baseURL
        self.session = URLSession.shared
    }
    
    /// Send chat request to Neuriy REST API Gateway
    public func sendMessage(
        messages: [NeuriyMessage],
        model: String = "pro",
        webSearch: Bool = false,
        deepThink: Bool = false,
        temperature: Double = 0.7
    ) async throws -> NeuriyChatResponse {
        let endpoint = baseURL.appendingPathComponent("api/chat")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload = NeuriyChatRequest(
            messages: messages,
            model: model,
            webSearch: webSearch,
            deepThink: deepThink,
            temperature: temperature
        )
        
        request.httpBody = try JSONEncoder().encode(payload)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONDecoder().decode(NeuriyChatResponse.self, from: data)
    }
    
    /// Fetch available Neuriy AI models
    public func fetchModels() async throws -> [NeuriyModel] {
        let endpoint = baseURL.appendingPathComponent("api/models")
        let (data, _) = try await session.data(from: endpoint)
        
        struct ModelsResponse: Codable {
            let models: [NeuriyModel]
        }
        
        let response = try JSONDecoder().decode(ModelsResponse.self, from: data)
        return response.models
    }
}
