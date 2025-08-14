/**
 * @copyright Omnior
 * @license LicenseRef-Omnior-Proprietary
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  Highlighter, 
  Share2, 
  Plus,
  Settings,
  User,
  LogOut,
  Copy,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PanelHeader } from '@/components/ui/panel-header';
import { Panel } from '@/components/ui/panel';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/auth/store';
import type { 
  CollaborationSession, 
  UserPresence, 
  Annotation, 
  Comment 
} from '@/lib/collaboration/collaboration-service';

interface CollaborationPanelProps {
  documentId?: string;
  documentTitle?: string;
}

export function CollaborationPanel({ 
  documentId = 'default', 
  documentTitle = 'Document' 
}: CollaborationPanelProps) {
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState(`session-${documentId}-${Date.now()}`);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('participants');
  const socketRef = useRef<any>(null);
  
  const { user } = useAuthStore();
  const { toast } = useToast();

  // Generate random color for user
  const generateUserColor = useCallback(() => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  // Initialize collaboration
  useEffect(() => {
    if (!user) return;

    const initializeCollaboration = async () => {
      try {
        // Connect to Socket.IO
        const { io } = await import('socket.io-client');
        socketRef.current = io('http://localhost:3000', {
          transports: ['websocket', 'polling']
        });

        socketRef.current.on('connect', () => {
          setIsConnected(true);
          console.log('Connected to collaboration server');
        });

        socketRef.current.on('disconnect', () => {
          setIsConnected(false);
          console.log('Disconnected from collaboration server');
        });

        // Set up event handlers
        socketRef.current.on('session-joined', (data: { session: CollaborationSession }) => {
          setSession(data.session);
        });

        socketRef.current.on('user-joined', (data: { user: UserPresence; session: CollaborationSession }) => {
          setSession(data.session);
          toast({
            title: "User joined",
            description: `${data.user.name} joined the session`,
          });
        });

        socketRef.current.on('user-left', (data: { userId: string; session: CollaborationSession }) => {
          setSession(data.session);
        });

        socketRef.current.on('cursor-moved', (data: { userId: string; cursor: { x: number; y: number } }) => {
          // Handle cursor movement (would update UI in real implementation)
          console.log('Cursor moved:', data);
        });

        socketRef.current.on('selection-changed', (data: { userId: string; selection: any }) => {
          // Handle selection changes (would update UI in real implementation)
          console.log('Selection changed:', data);
        });

        socketRef.current.on('annotation-added', (data: { annotation: Annotation; session: CollaborationSession }) => {
          setSession(data.session);
        });

        socketRef.current.on('annotation-removed', (data: { annotationId: string; session: CollaborationSession }) => {
          setSession(data.session);
        });

        socketRef.current.on('comment-added', (data: { comment: Comment; session: CollaborationSession }) => {
          setSession(data.session);
        });

        socketRef.current.on('comment-updated', (data: { commentId: string; content: string; session: CollaborationSession }) => {
          setSession(data.session);
        });

        socketRef.current.on('comment-deleted', (data: { commentId: string; session: CollaborationSession }) => {
          setSession(data.session);
        });

        // Join session
        socketRef.current.emit('join-session', {
          sessionId,
          user: {
            id: user.id,
            name: user.name || user.email || 'Anonymous',
            email: user.email,
            color: generateUserColor(),
            isActive: true
          }
        });

      } catch (error) {
        console.error('Failed to initialize collaboration:', error);
        toast({
          title: "Connection failed",
          description: "Failed to connect to collaboration server",
          variant: "destructive"
        });
      }
    };

    initializeCollaboration();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, sessionId, generateUserColor, toast]);

  // Handle session creation
  const handleCreateSession = useCallback(() => {
    const newSessionId = `session-${documentId}-${Date.now()}`;
    setSessionId(newSessionId);
    
    if (socketRef.current && user) {
      socketRef.current.emit('join-session', {
        sessionId: newSessionId,
        user: {
          id: user.id,
          name: user.name || user.email || 'Anonymous',
          email: user.email,
          color: generateUserColor(),
          isActive: true
        }
      });
    }
  }, [documentId, user, generateUserColor]);

  // Handle session join
  const handleJoinSession = useCallback(() => {
    const inputSessionId = prompt('Enter session ID:');
    if (inputSessionId && socketRef.current && user) {
      setSessionId(inputSessionId);
      socketRef.current.emit('join-session', {
        sessionId: inputSessionId,
        user: {
          id: user.id,
          name: user.name || user.email || 'Anonymous',
          email: user.email,
          color: generateUserColor(),
          isActive: true
        }
      });
    }
  }, [user, generateUserColor]);

  // Handle comment submission
  const handleCommentSubmit = useCallback(() => {
    if (!newComment.trim() || !socketRef.current || !user) return;

    socketRef.current.emit('comment-add', {
      sessionId,
      comment: {
        userId: user.id,
        content: newComment.trim()
      }
    });

    setNewComment('');
  }, [newComment, sessionId, user]);

  // Handle session ID copy
  const handleCopySessionId = useCallback(() => {
    navigator.clipboard.writeText(sessionId);
    toast({
      title: "Copied to clipboard",
      description: "Session ID copied to clipboard",
    });
  }, [sessionId, toast]);

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Panel className="h-full flex flex-col">
      <PanelHeader
        title="Collaboration"
        description="Real-time collaboration with other users"
        actions={
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        }
      />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Session Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Input
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="flex-1 text-xs"
              placeholder="Session ID"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopySessionId}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateSession}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              New Session
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleJoinSession}
              className="flex items-center gap-1"
            >
              <Users className="h-3 w-3" />
              Join Session
            </Button>
          </div>
        </div>

        {/* Session Info */}
        {session && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sm">{session.documentTitle}</h3>
              <Badge variant="secondary" className="text-xs">
                {session.participants.length} active
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Session ID: {session.id}
            </p>
          </div>
        )}

        {/* Collaboration Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="participants" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="text-xs">People</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span className="text-xs">Comments</span>
            </TabsTrigger>
            <TabsTrigger value="annotations" className="flex items-center gap-1">
              <Highlighter className="h-3 w-3" />
              <span className="text-xs">Annotations</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {session?.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`text-white ${participant.color}`}>
                        {participant.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {participant.name}
                        </span>
                        {participant.isActive && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Last seen {formatTimestamp(participant.lastSeen)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!session || session.participants.length === 0) && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">
                    No participants in this session
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comments" className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {session?.comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">
                          {session.participants.find(p => p.id === comment.userId)?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {formatTimestamp(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-900 dark:text-slate-100">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                  {(!session || session.comments.length === 0) && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">
                      No comments yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                  className="flex-1"
                />
                <Button
                  onClick={handleCommentSubmit}
                  disabled={!newComment.trim()}
                  size="sm"
                >
                  Send
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="annotations" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {session?.annotations.map((annotation) => (
                  <div key={annotation.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {annotation.type}
                      </Badge>
                      {annotation.color && (
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: annotation.color }}
                        />
                      )}
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {formatTimestamp(annotation.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-900 dark:text-slate-100">
                      {annotation.content}
                    </p>
                  </div>
                ))}
                {(!session || session.annotations.length === 0) && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">
                    No annotations yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </Panel>
  );
}