'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Resizable } from 're-resizable'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Send, ChevronDown, ChevronUp, Search, Check, Copy, X, Upload, FileText, Trash2, Image as ImageIcon } from 'lucide-react'
import { fetchGPTResponseStream } from '@/lib/api'
import { promptCards } from '@/lib/prompts'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface UploadedDocument {
  name: string;
  content: string;
  type: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const LoadingAnimation: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <motion.div
        className="w-3 h-3 bg-blue-500 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="w-3 h-3 bg-blue-500 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />
      <motion.div
        className="w-3 h-3 bg-blue-500 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.4,
        }}
      />
    </div>
  )
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hallo! Ich bin Immostant. Wie kann ich dir heute bei deinen Immobilienaufgaben helfen?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [chatHeight, setChatHeight] = useState(500);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentlyTyping, setCurrentlyTyping] = useState('');
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isLoading, currentlyTyping]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !uploadedDocument) return;

    const userMessage: Message = { 
      role: 'user', 
      content: input + (uploadedDocument ? `\n\nUploaded document: ${uploadedDocument.name}` : '')
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentlyTyping('');

    try {
      let fullResponse = '';
      for await (const chunk of fetchGPTResponseStream(userMessage.content, uploadedDocument ? [uploadedDocument] : [])) {
        fullResponse += chunk;
        setCurrentlyTyping(prev => prev + chunk);
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
      setCurrentlyTyping('');
    } catch (error) {
      console.error('Error fetching GPT response:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage. Bitte versuchen Sie es später erneut.'
        }
      ]);
    } finally {
      setIsLoading(false);
      setUploadedDocument(null);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        setUploadedDocument({ 
          name: file.name, 
          content: content,
          type: file.type
        });
      };
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const removeUploadedDocument = () => {
    setUploadedDocument(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const relatedTarget = e.relatedTarget as Node;
    if (!e.currentTarget.contains(relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const filteredCards = promptCards.filter(card => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (selectedCategory ? card.category === selectedCategory : true) &&
      (card.title.toLowerCase().includes(searchLower) ||
       card.content.toLowerCase().includes(searchLower) ||
       card.category.toLowerCase().includes(searchLower))
    );
  });

  const toggleCard = (id: number) => {
    setExpandedCards(prev => 
      prev.includes(id) ? prev.filter(cardId => cardId !== id) : [...prev, id]
    );
  };

  const handlePromptClick = (content: string) => {
    setInput(content);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(prev => prev === category ? null : category);
    setSearchTerm('');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    const matchedCategory = promptCards.find(card => card.category.toLowerCase() === value.toLowerCase())?.category;
    setSelectedCategory(matchedCategory || null);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  return (
    <div className="flex h-screen max-w-7xl mx-auto p-4 overflow-hidden">
      <div className="w-1/4 pr-4 flex flex-col overflow-hidden">
        <div className="mb-4 relative">
          <Input
            type="text"
            placeholder="Suche nach Prompts oder Kategorien..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pr-10"
          />
          <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        {selectedCategory && (
          <div className="mb-4 flex items-center">
            <span className="text-sm mr-2">Ausgewählte Kategorie:</span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${getCategoryStyle(selectedCategory)}`}>
              {selectedCategory}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory(null);
                setSearchTerm('');
              }}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="overflow-y-auto flex-grow">
          {filteredCards.map(card => (
            <Card key={card.id} className="mb-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  {React.createElement(card.icon, { className: "h-5 w-5" })}
                  <CardTitle className="text-xs font-medium">
                    {card.title}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCard(card.id)}
                >
                  {expandedCards.includes(card.id) ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {card.content}
                </p>
                {expandedCards.includes(card.id) && (
                  <div className="mt-2">
                    <p className="text-xs mb-2">{card.content}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePromptClick(card.content)}
                    >
                      Prompt verwenden
                    </Button>
                  </div>
                )}
                <div className="mt-2">
                  <span 
                    className={`text-xs font-semibold mr-2 px-2.5 py-0.5 rounded border ${getCategoryStyle(card.category)} cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => handleCategoryClick(card.category)}
                  >
                    {card.category}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div 
        className="w-3/4 flex flex-col"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Resizable
          size={{ width: '100%', height: chatHeight }}
          minHeight={300}
          maxHeight="80vh"
          onResize={(e, direction, ref, d) => {
            setChatHeight(chatHeight + d.height);
          }}
          enable={{ bottom: true }}
          handleComponent={{
            bottom: <div className="h-2 w-full cursor-ns-resize bg-gray-300 hover:bg-gray-400 transition-colors" />,
          }}
        >
          <Card className={`flex flex-col h-full overflow-hidden relative ${isDragging ? 'border-2 border-dashed border-blue-500' : ''}`}>
            {isDragging && (
              <div className="absolute inset-0 bg-blue-100 bg-opacity-50 flex items-center justify-center z-10">
                <p className="text-blue-500 font-semibold">Datei hier ablegen</p>
              </div>
            )}
            <div ref={chatWindowRef} className="flex-grow overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-start ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="mr-2 flex-shrink-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <Image
                            src="/maklerkopf-logo.png"
                            alt="Maklerkopf Logo"
                            width={40}
                            height={40}
                            layout="responsive"
                          />
                        </div>
                      </div>
                    )}
                    <div  className="flex items-start max-w-[80%]">
                      <div className={`relative rounded-lg p-3 ${message.role === 'assistant' ? 'bg-gray-100' : 'bg-blue-500 text-white'} text-sm shadow-md`}>
                        {formatMessage(message.content)}
                      </div>
                      {message.role === 'assistant' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
                                onClick={() => copyToClipboard(message.content, index)}
                                aria-label="Nachricht kopieren"
                              >
                                {copiedIndex === index ? <Check className="h-4 w-4" /> : <Copy className="h-4  w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{copiedIndex === index ? 'Kopiert!' : 'Kopieren'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-start"
                >
                  <div className="mr-2 flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src="/maklerkopf-logo.png"
                        alt="Maklerkopf Logo"
                        width={40}
                        height={40}
                        layout="responsive"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg p-3 bg-gray-100 text-sm shadow-md">
                    <LoadingAnimation />
                    <span>{currentlyTyping || 'Generiere Antwort...'}</span>
                  </div>
                </motion.div>
              )}
            </div>
            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="flex items-center">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ihre Nachricht..."
                  className="flex-1 mr-2 text-sm"
                  aria-label="Ihre Nachricht eingeben"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="mr-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        <span className="sr-only">Dokument hochladen</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Dokument hochladen</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  className="hidden"
                  accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-sans">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Senden</span>
                </Button>
              </div>
              {uploadedDocument && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 flex items-center justify-between bg-gray-100 rounded-md p-2"
                >
                  <div className="flex items-center">
                    {uploadedDocument.type.startsWith('image/') ? (
                      <ImageIcon className="h-5 w-5 text-blue-500 mr-2" />
                    ) : (
                      <FileText className="h-5 w-5 text-blue-500 mr-2" />
                    )}
                    <span className="text-sm text-gray-700 truncate max-w-[200px]">
                      {uploadedDocument.name}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="secondary" className="mr-2">
                      Bereit
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeUploadedDocument}
                      aria-label="Dokument entfernen"
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </form>
          </Card>
        </Resizable>
      </div>
    </div>
  )
}

function getCategoryStyle(category: string) {
  switch (category) {
    case 'Marketing':
      return 'border-blue-500 text-blue-500';
    case 'Social Media':
      return 'border-green-500 text-green-500';
    case 'Service':
      return 'border-yellow-500 text-yellow-500';
    case 'Analyse':
      return 'border-purple-500 text-purple-500';
    case 'Verkauf':
      return 'border-red-500 text-red-500';
    default:
      return 'border-gray-500 text-gray-500';
  }
}