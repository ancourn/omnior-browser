"use server"

import { Server as IOServer } from "socket.io"
import { Server as NetServer } from "http"

// Collaboration event types
export type CollaborationEvent = 
  | 'user-join'
  | 'user-leave'
  | 'cursor-move'
  | 'selection-change'
  | 'text-change'
  | 'annotation-add'
  | 'annotation-remove'
  | 'highlight-add'
  | 'highlight-remove'
  | 'comment-add'
  | 'comment-update'
  | 'comment-delete'
  | 'session-start'
  | 'session-end'
  | 'presence-update'

// User presence information
export interface UserPresence {
  id: string
  name: string
  email?: string
  avatar?: string
  color: string
  cursor?: {
    x: number
    y: number
  }
  selection?: {
    start: number
    end: number
    text: string
  }
  isActive: boolean
  lastSeen: number
}

// Annotation data
export interface Annotation {
  id: string
  userId: string
  type: 'highlight' | 'comment' | 'bookmark'
  content: string
  position: {
    start: number
    end: number
  }
  color?: string
  createdAt: number
  updatedAt: number
}

// Comment data
export interface Comment {
  id: string
  userId: string
  content: string
  position?: {
    x: number
    y: number
  }
  parentId?: string
  replies: Comment[]
  createdAt: number
  updatedAt: number
}

// Collaboration session
export interface CollaborationSession {
  id: string
  documentId: string
  documentUrl: string
  documentTitle: string
  ownerId: string
  participants: UserPresence[]
  annotations: Annotation[]
  comments: Comment[]
  isActive: boolean
  createdAt: number
  updatedAt: number
}

// Collaboration event data
export interface CollaborationEventData {
  sessionId: string
  userId: string
  type: CollaborationEvent
  data: any
  timestamp: number
}

// Collaboration service
export class CollaborationService {
  private io: IOServer | null = null
  private sessions: Map<string, CollaborationSession> = new Map()
  private userSessions: Map<string, string[]> = new Map() // userId -> sessionIds

  initialize(server: NetServer) {
    this.io = new IOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:3000"],
        methods: ["GET", "POST"]
      }
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    if (!this.io) return

    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`)

      // Handle session join
      socket.on('join-session', async (data: {
        sessionId: string
        user: Omit<UserPresence, 'lastSeen'>
      }) => {
        try {
          const { sessionId, user } = data
          await this.handleJoinSession(socket, sessionId, user)
        } catch (error) {
          console.error('Error joining session:', error)
          socket.emit('error', { message: 'Failed to join session' })
        }
      })

      // Handle session leave
      socket.on('leave-session', (data: { sessionId: string }) => {
        try {
          const { sessionId } = data
          this.handleLeaveSession(socket, sessionId)
        } catch (error) {
          console.error('Error leaving session:', error)
        }
      })

      // Handle cursor movement
      socket.on('cursor-move', (data: {
        sessionId: string
        cursor: { x: number; y: number }
      }) => {
        try {
          const { sessionId, cursor } = data
          this.handleCursorMove(socket, sessionId, cursor)
        } catch (error) {
          console.error('Error handling cursor move:', error)
        }
      })

      // Handle text selection
      socket.on('selection-change', (data: {
        sessionId: string
        selection: { start: number; end: number; text: string }
      }) => {
        try {
          const { sessionId, selection } = data
          this.handleSelectionChange(socket, sessionId, selection)
        } catch (error) {
          console.error('Error handling selection change:', error)
        }
      })

      // Handle annotation add
      socket.on('annotation-add', (data: {
        sessionId: string
        annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>
      }) => {
        try {
          const { sessionId, annotation } = data
          this.handleAnnotationAdd(socket, sessionId, annotation)
        } catch (error) {
          console.error('Error adding annotation:', error)
        }
      })

      // Handle annotation remove
      socket.on('annotation-remove', (data: {
        sessionId: string
        annotationId: string
      }) => {
        try {
          const { sessionId, annotationId } = data
          this.handleAnnotationRemove(socket, sessionId, annotationId)
        } catch (error) {
          console.error('Error removing annotation:', error)
        }
      })

      // Handle comment add
      socket.on('comment-add', (data: {
        sessionId: string
        comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'replies'>
      }) => {
        try {
          const { sessionId, comment } = data
          this.handleCommentAdd(socket, sessionId, comment)
        } catch (error) {
          console.error('Error adding comment:', error)
        }
      })

      // Handle comment update
      socket.on('comment-update', (data: {
        sessionId: string
        commentId: string
        content: string
      }) => {
        try {
          const { sessionId, commentId, content } = data
          this.handleCommentUpdate(socket, sessionId, commentId, content)
        } catch (error) {
          console.error('Error updating comment:', error)
        }
      })

      // Handle comment delete
      socket.on('comment-delete', (data: {
        sessionId: string
        commentId: string
      }) => {
        try {
          const { sessionId, commentId } = data
          this.handleCommentDelete(socket, sessionId, commentId)
        } catch (error) {
          console.error('Error deleting comment:', error)
        }
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`)
        this.handleDisconnect(socket)
      })
    })
  }

  private async handleJoinSession(
    socket: any, 
    sessionId: string, 
    user: Omit<UserPresence, 'lastSeen'>
  ) {
    if (!this.io) return

    // Get or create session
    let session = this.sessions.get(sessionId)
    if (!session) {
      session = await this.createSession(sessionId, user.id)
      this.sessions.set(sessionId, session)
    }

    // Join socket room
    socket.join(sessionId)

    // Add user to session
    const userPresence: UserPresence = {
      ...user,
      lastSeen: Date.now()
    }

    // Update user sessions mapping
    const userSessionIds = this.userSessions.get(user.id) || []
    userSessionIds.push(sessionId)
    this.userSessions.set(user.id, userSessionIds)

    // Add or update user in session
    const existingUserIndex = session.participants.findIndex(p => p.id === user.id)
    if (existingUserIndex >= 0) {
      session.participants[existingUserIndex] = userPresence
    } else {
      session.participants.push(userPresence)
    }

    // Update session timestamp
    session.updatedAt = Date.now()

    // Notify other users
    socket.to(sessionId).emit('user-joined', {
      user: userPresence,
      session
    })

    // Send session data to joining user
    socket.emit('session-joined', {
      session,
      user: userPresence
    })

    console.log(`User ${user.id} joined session ${sessionId}`)
  }

  private handleLeaveSession(socket: any, sessionId: string) {
    if (!this.io) return

    const session = this.sessions.get(sessionId)
    if (!session) return

    // Find user in session
    const userIndex = session.participants.findIndex(p => p.id === socket.id)
    if (userIndex >= 0) {
      const user = session.participants[userIndex]
      session.participants.splice(userIndex, 1)

      // Update user sessions mapping
      const userSessionIds = this.userSessions.get(user.id) || []
      const sessionIndex = userSessionIds.indexOf(sessionId)
      if (sessionIndex >= 0) {
        userSessionIds.splice(sessionIndex, 1)
      }
      if (userSessionIds.length === 0) {
        this.userSessions.delete(user.id)
      } else {
        this.userSessions.set(user.id, userSessionIds)
      }

      // Update session timestamp
      session.updatedAt = Date.now()

      // Notify other users
      socket.to(sessionId).emit('user-left', {
        userId: user.id,
        session
      })
    }

    // Leave socket room
    socket.leave(sessionId)

    console.log(`User ${socket.id} left session ${sessionId}`)
  }

  private handleCursorMove(socket: any, sessionId: string, cursor: { x: number; y: number }) {
    if (!this.io) return

    const session = this.sessions.get(sessionId)
    if (!session) return

    // Update user cursor
    const user = session.participants.find(p => p.id === socket.id)
    if (user) {
      user.cursor = cursor
      user.lastSeen = Date.now()
      session.updatedAt = Date.now()

      // Broadcast cursor movement to other users
      socket.to(sessionId).emit('cursor-moved', {
        userId: socket.id,
        cursor
      })
    }
  }

  private handleSelectionChange(socket: any, sessionId: string, selection: { start: number; end: number; text: string }) {
    if (!this.io) return

    const session = this.sessions.get(sessionId)
    if (!session) return

    // Update user selection
    const user = session.participants.find(p => p.id === socket.id)
    if (user) {
      user.selection = selection
      user.lastSeen = Date.now()
      session.updatedAt = Date.now()

      // Broadcast selection change to other users
      socket.to(sessionId).emit('selection-changed', {
        userId: socket.id,
        selection
      })
    }
  }

  private handleAnnotationAdd(socket: any, sessionId: string, annotationData: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!this.io) return

    const session = this.sessions.get(sessionId)
    if (!session) return

    // Create annotation
    const annotation: Annotation = {
      ...annotationData,
      id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    // Add to session
    session.annotations.push(annotation)
    session.updatedAt = Date.now()

    // Broadcast to all users in session
    this.io.to(sessionId).emit('annotation-added', {
      annotation,
      session
    })

    console.log(`Annotation added by ${socket.id} in session ${sessionId}`)
  }

  private handleAnnotationRemove(socket: any, sessionId: string, annotationId: string) {
    if (!this.io) return

    const session = this.sessions.get(sessionId)
    if (!session) return

    // Remove annotation
    const annotationIndex = session.annotations.findIndex(a => a.id === annotationId)
    if (annotationIndex >= 0) {
      const annotation = session.annotations[annotationIndex]
      session.annotations.splice(annotationIndex, 1)
      session.updatedAt = Date.now()

      // Broadcast to all users in session
      this.io.to(sessionId).emit('annotation-removed', {
        annotationId,
        session
      })

      console.log(`Annotation removed by ${socket.id} in session ${sessionId}`)
    }
  }

  private handleCommentAdd(socket: any, sessionId: string, commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'replies'>) {
    if (!this.io) return

    const session = this.sessions.get(sessionId)
    if (!session) return

    // Create comment
    const comment: Comment = {
      ...commentData,
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      replies: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    // Add to session
    session.comments.push(comment)
    session.updatedAt = Date.now()

    // Broadcast to all users in session
    this.io.to(sessionId).emit('comment-added', {
      comment,
      session
    })

    console.log(`Comment added by ${socket.id} in session ${sessionId}`)
  }

  private handleCommentUpdate(socket: any, sessionId: string, commentId: string, content: string) {
    if (!this.io) return

    const session = this.sessions.get(sessionId)
    if (!session) return

    // Update comment
    const comment = session.comments.find(c => c.id === commentId)
    if (comment) {
      comment.content = content
      comment.updatedAt = Date.now()
      session.updatedAt = Date.now()

      // Broadcast to all users in session
      this.io.to(sessionId).emit('comment-updated', {
        commentId,
        content,
        session
      })

      console.log(`Comment updated by ${socket.id} in session ${sessionId}`)
    }
  }

  private handleCommentDelete(socket: any, sessionId: string, commentId: string) {
    if (!this.io) return

    const session = this.sessions.get(sessionId)
    if (!session) return

    // Remove comment
    const commentIndex = session.comments.findIndex(c => c.id === commentId)
    if (commentIndex >= 0) {
      const comment = session.comments[commentIndex]
      session.comments.splice(commentIndex, 1)
      session.updatedAt = Date.now()

      // Broadcast to all users in session
      this.io.to(sessionId).emit('comment-deleted', {
        commentId,
        session
      })

      console.log(`Comment deleted by ${socket.id} in session ${sessionId}`)
    }
  }

  private handleDisconnect(socket: any) {
    // Remove user from all sessions
    const userSessionIds = this.userSessions.get(socket.id)
    if (userSessionIds) {
      userSessionIds.forEach(sessionId => {
        this.handleLeaveSession(socket, sessionId)
      })
    }
  }

  private async createSession(sessionId: string, ownerId: string): Promise<CollaborationSession> {
    return {
      id: sessionId,
      documentId: `doc-${Date.now()}`,
      documentUrl: '',
      documentTitle: 'Collaborative Document',
      ownerId,
      participants: [],
      annotations: [],
      comments: [],
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  // Public methods
  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId)
  }

  getAllSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values())
  }

  getUserSessions(userId: string): CollaborationSession[] {
    const sessionIds = this.userSessions.get(userId) || []
    return sessionIds.map(id => this.sessions.get(id)).filter(Boolean) as CollaborationSession[]
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.isActive = false
      session.updatedAt = Date.now()

      if (this.io) {
        this.io.to(sessionId).emit('session-ended', { session })
      }

      // Remove all participants
      session.participants.forEach(participant => {
        const userSessionIds = this.userSessions.get(participant.id) || []
        const index = userSessionIds.indexOf(sessionId)
        if (index >= 0) {
          userSessionIds.splice(index, 1)
        }
        if (userSessionIds.length === 0) {
          this.userSessions.delete(participant.id)
        } else {
          this.userSessions.set(participant.id, userSessionIds)
        }
      })

      console.log(`Session ${sessionId} ended`)
    }
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService()