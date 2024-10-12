"use client"

import React, { useState } from 'react'
import { Plus, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useStore } from '@/lib/store'

export default function Component({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { dashboards, addDashboard, setCurrentDashboard } = useStore()
  const [newDashboardName, setNewDashboardName] = useState('')

  const handleCreateDashboard = () => {
    if (newDashboardName.trim()) {
      const newDashboardId = addDashboard(newDashboardName.trim())
      setNewDashboardName('')
      setCurrentDashboard(newDashboardId)
      setActiveTab('dashboard')
    }
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-2xl font-semibold mb-6 text-black">Eigentümerreport Übersicht</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dashboards.map((dashboard) => (
          <Card 
            key={dashboard.id} 
            className="cursor-pointer hover:shadow-md transition-shadow duration-200 bg-white border border-gray-200"
            onClick={() => {
              setCurrentDashboard(dashboard.id)
              setActiveTab('dashboard')
            }}
          >
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-black">{dashboard.name}</h2>
                <p className="text-sm text-gray-600">
                  Erstellt am: {new Date(dashboard.createdAt).toLocaleDateString()}
                </p>
              </div>
              <ChevronRight className="text-gray-400" />
            </CardContent>
          </Card>
        ))}
        <Card className="border border-dashed border-gray-300 bg-white">
          <CardContent className="p-4">
            <h2 className="text-lg font-medium mb-3 text-black">Neuer Eigentümerreport</h2>
            <div className="space-y-3">
              <Input
                placeholder="Report Name"
                value={newDashboardName}
                onChange={(e) => setNewDashboardName(e.target.value)}
                className="w-full border-gray-300"
              />
              <Button 
                onClick={handleCreateDashboard} 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-sans"
              >
                <Plus className="mr-2 h-4 w-4" /> Erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}