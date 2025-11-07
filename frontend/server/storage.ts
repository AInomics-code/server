import { conversations, messages, type Conversation, type Message, type InsertConversation, type InsertMessage } from "@shared/schema";

export interface IStorage {
  getConversations(): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private conversationIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.conversations = new Map();
    this.messages = new Map();
    this.conversationIdCounter = 1;
    this.messageIdCounter = 1;

    // Initialize with sample conversations
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const now = new Date();
    
    const conversation: Conversation = {
      id: this.conversationIdCounter++,
      title: "La Doña Business Chat",
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(conversation.id, conversation);
  }

  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const now = new Date();
    const conversation: Conversation = {
      id: this.conversationIdCounter++,
      ...insertConversation,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async deleteConversation(id: number): Promise<void> {
    this.conversations.delete(id);
    // Also delete associated messages
    const messagesToDelete = Array.from(this.messages.values())
      .filter(msg => msg.conversationId === id);
    messagesToDelete.forEach(msg => this.messages.delete(msg.id));
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      id: this.messageIdCounter++,
      ...insertMessage,
      createdAt: new Date(),
    };
    this.messages.set(message.id, message);

    // Update conversation's updatedAt timestamp
    const conversation = this.conversations.get(insertMessage.conversationId);
    if (conversation) {
      conversation.updatedAt = new Date();
      this.conversations.set(conversation.id, conversation);
    }

    return message;
  }
}

export const storage = new MemStorage();
