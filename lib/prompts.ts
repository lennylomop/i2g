import React from 'react'
import { FileText, Users, PenTool, TrendingUp, Home, DollarSign, Building, Key, Briefcase } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

export interface PromptCard {
  id: number;
  title: string;
  content: string;
  category: string;
  icon: LucideIcon;
}

export const promptCards: PromptCard[] = [
  { 
    id: 1, 
    title: "Expose erstellen", 
    content: "Erstellen Sie ein überzeugendes Exposé für eine Luxusvilla mit 5 Schlafzimmern, Meerblick und privatem Pool.", 
    category: "Marketing", 
    icon: FileText
  },
  { 
    id: 2, 
    title: "Social Media Post", 
    content: "Verfassen Sie einen ansprechenden Instagram-Post über eine neu gelistete Penthouse-Wohnung im Stadtzentrum.", 
    category: "Social Media", 
    icon: Users
  },
  { 
    id: 3, 
    title: "Kundenfeedback", 
    content: "Formulieren Sie eine höfliche Antwort auf eine negative Kundenbewertung bezüglich einer verzögerten Immobilienbesichtigung.", 
    category: "Service", 
    icon: PenTool
  },
  { 
    id: 4, 
    title: "Marktanalyse", 
    content: "Erstellen Sie eine kurze Marktanalyse für den Immobilienmarkt in Berlin-Mitte für das letzte Quartal.", 
    category: "Analyse", 
    icon: TrendingUp
  },
  { 
    id: 5, 
    title: "Verkaufspräsentation", 
    content: "Bereiten Sie eine überzeugende Verkaufspräsentation für ein historisches Gebäude vor, das in ein Boutique-Hotel umgewandelt werden soll.", 
    category: "Verkauf", 
    icon: Home
  },
  { 
    id: 6, 
    title: "Newsletter", 
    content: "Verfassen Sie einen monatlichen Newsletter, der die neuesten Immobilienangebote und Markttrends hervorhebt.", 
    category: "Marketing", 
    icon: FileText
  },
  // Add more prompts here...
]

export const categoryColors: {[key: string]: string} = {
  "Marketing": "bg-blue-100 text-blue-800",
  "Social Media": "bg-green-100 text-green-800",
  "Service": "bg-yellow-100 text-yellow-800",
  "Analyse": "bg-purple-100 text-purple-800",
  "Verkauf": "bg-red-100 text-red-800",
  // Add more categories here...
}