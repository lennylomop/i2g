import React, { useState } from 'react'
import Header from '@/components/headers'
import { MessageSquare, Home, FileText, PenTool, Newspaper, Calculator, TrendingUp } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ChatAssistant from './ChatAssistant'
import EigentumerReportOverview from './EigentumerReportOverview'
import Dashboard from './Dashboard'
import InputPage from './InputPage'
import ImmoReport from './ToDoListe'
import FloorPlanDrawer from './FloorPlanDrawer'
import NewsPage from './NewsPage'
import { useStore } from '@/lib/store'
import CreditCalculator from './credit-calculator'
import Zinsmonitor from './Zinsmonitor'

export default function ImmobilienSoftware() {
  const [activeTab, setActiveTab] = useState('news')
  const { backgroundColor, textColor1, textColor2, currentDashboard, setCurrentDashboard } = useStore()

  return (
    <div className="flex h-screen bg-gray-100" style={{ backgroundColor }}>
      <nav className="w-16 bg-white shadow-md">
        <div className="flex flex-col items-center py-4 space-y-4">
          <Button variant="ghost" size="icon" onClick={() => setActiveTab('news')} aria-label="Neuigkeiten">
            <Newspaper className={`h-6 w-6 ${activeTab === 'news' ? 'text-blue-500' : 'text-gray-500'}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setActiveTab('chat')} aria-label="Chat-Assistent">
            <MessageSquare className={`h-6 w-6 ${activeTab === 'chat' ? 'text-blue-500' : 'text-gray-500'}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => {
            setActiveTab('eigentuemer')
            setCurrentDashboard(null)
          }} aria-label="Eigentümerreport">
            <Home className={`h-6 w-6 ${activeTab === 'eigentuemer' || activeTab === 'dashboard' ? 'text-blue-500' : 'text-gray-500'}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setActiveTab('immoreport')} aria-label="Immobilienreport">
            <FileText className={`h-6 w-6 ${activeTab === 'immoreport' ? 'text-blue-500' : 'text-gray-500'}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setActiveTab('floorplan')} aria-label="Grundrisszeichner">
            <PenTool className={`h-6 w-6 ${activeTab === 'floorplan' ? 'text-blue-500' : 'text-gray-500'}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setActiveTab('creditcalculator')} aria-label="Kreditrechner">
            <Calculator className={`h-6 w-6 ${activeTab === 'creditcalculator' ? 'text-blue-500' : 'text-gray-500'}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setActiveTab('zinsmonitor')} aria-label="Zinsmonitor">
            <TrendingUp className={`h-6 w-6 ${activeTab === 'zinsmonitor' ? 'text-blue-500' : 'text-gray-500'}`} />
          </Button>
        </div>
      </nav>

      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold" style={{ color: textColor1 }}>Immobilienmakler-Software</h1>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Benutzer" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <span style={{ color: textColor2 }}>Max Mustermann</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'news' && <NewsPage />}
          {activeTab === 'chat' && <ChatAssistant />}
          {activeTab === 'eigentuemer' && !currentDashboard && <EigentumerReportOverview setActiveTab={setActiveTab} />}
          {(activeTab === 'eigentuemer' && currentDashboard) || activeTab === 'dashboard' ? (
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-2/3">
                <Dashboard />
              </div>
              <div className="w-full md:w-1/3">
                <InputPage />
              </div>
            </div>
          ) : null}
          {activeTab === 'immoreport' && <ImmoReport />}
          {activeTab === 'floorplan' && <FloorPlanDrawer />}
          {activeTab === 'creditcalculator' && <CreditCalculator />}
          {activeTab === 'zinsmonitor' && <Zinsmonitor />}
        </div>
      </main>
    </div>
  )
}