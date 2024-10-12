import React, { useRef, useState, useMemo } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Download, Home, Save, Users, Bookmark, UserCheck, Check, X } from 'lucide-react'
import { AttraktivitaetsSettings, useStore, Kaufangebot } from '@/lib/store'
import html2canvas from 'html2canvas'
import { useRouter } from 'next/navigation'
const getAttraktivitaetColor = (value: number, settings: AttraktivitaetsSettings) => {
  const greenThreshold = typeof settings.greenThreshold === 'string' ? parseFloat(settings.greenThreshold) : settings.greenThreshold;
  const yellowThreshold = typeof settings.yellowThreshold === 'string' ? parseFloat(settings.yellowThreshold) : settings.yellowThreshold;

  if (value >= greenThreshold) return '#22c55e' // green-500
  if (value >= yellowThreshold) return '#eab308' // yellow-500
  return '#ef4444' // red-500
}

const getKaufangebotStyle = (angebot: Kaufangebot, index: number) => {
  if (!angebot.empfehlung) {
    return 'bg-gradient-to-br from-orange-300 to-orange-700' // Bronze for not recommended
  }
  switch (index) {
    case 0: return 'bg-gradient-to-br from-yellow-500 via-yellow-400 to-yellow-600' // Gold
    case 1: return 'bg-gradient-to-br from-gray-300 to-gray-500' // Silver
    default: return 'bg-gradient-to-br from-orange-300 to-orange-700' // Bronze
  }
}

export default function Dashboard() {
  const router = useRouter()

  const { 
    image, 
    statsHistory, 
    absageGruende, 
    kaufangebote,
    backgroundColor,
    backgroundColor2,
    textColor1,
    textColor2,
    getMostRecentStats,
    saveDashboard,
    currentDashboard,
    attraktivitaetsSettings,
  } = useStore()

  const mostRecentStats = useMemo(() => {
    const latestStats = { ...getMostRecentStats() };
    const sortedHistory = [...statsHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestDate = sortedHistory[0]?.date;
    
    if (latestDate) {
      const latestEntry = sortedHistory.find(entry => entry.date === latestDate);
      if (latestEntry) {
        latestStats.besucher = latestEntry.besucher;
        latestStats.lesezeichen = latestEntry.lesezeichen;
        latestStats.bewerber = latestEntry.bewerber;
      }
    }
    
    return latestStats;
  }, [getMostRecentStats, statsHistory]);

  const dashboardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  const hasStats = statsHistory.length > 0

  const formatAttraktivitaet = (value: number) => {
    return value < 10 ? value.toFixed(1) : Math.round(value);
  };

  const sortedStatsHistory = useMemo(() => {
    return [...statsHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [statsHistory]);

  const calculateAttraktivitaet = () => {
    if (!hasStats) return 0;
    if (attraktivitaetsSettings.calculation === 'bewerberLesezeichen') {
      if (mostRecentStats.lesezeichen === 0) return 0
      return (mostRecentStats.bewerber / mostRecentStats.lesezeichen) * 100
    } else {
      if (mostRecentStats.besucher === 0) return 0
      return (mostRecentStats.bewerber / mostRecentStats.besucher) * 100
    }
  }

  const attraktivitaet = calculateAttraktivitaet()
  const attraktivitaetColor = getAttraktivitaetColor(attraktivitaet, attraktivitaetsSettings)

  const sortedKaufangebote = useMemo(() => {
    return [...kaufangebote].sort((a, b) => {
      if (a.empfehlung && !b.empfehlung) return -1;
      if (!a.empfehlung && b.empfehlung) return 1;
      if (a.empfehlung === b.empfehlung) {
        if (a.finanzierung === 'vorhanden' && b.finanzierung !== 'vorhanden') return -1;
        if (a.finanzierung !== 'vorhanden' && b.finanzierung === 'vorhanden') return 1;
        if (a.finanzierung === 'ausstehend' && b.finanzierung === 'unwahrscheinlich') return -1;
        if (a.finanzierung === 'unwahrscheinlich' && b.finanzierung === 'ausstehend') return 1;
        return b.betrag - a.betrag;
      }
      return 0;
    });
  }, [kaufangebote]);

  const handleDownload = async (format: 'png' | 'jpeg') => {
    if (contentRef.current) {
      try {
        setIsGeneratingReport(true)
        const canvas = await html2canvas(contentRef.current, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
        })
        const dataUrl = canvas.toDataURL(`image/${format}`)
        const link = document.createElement('a')
        link.download = `Immobilien-Dashboard-Report.${format}`
        link.href = dataUrl
        link.click()
      } catch (error) {
        console.error(`Error generating ${format.toUpperCase()}:`, error)
      } finally {
        setIsGeneratingReport(false)
      }
    }
  }

  const handleSave = () => {
    if (currentDashboard) {
      saveDashboard(currentDashboard, {
        stats: mostRecentStats,
        absageGruende,
        kaufangebote,
        image
      })
      alert('Dashboard erfolgreich gespeichert!')
    } else {
      alert('Fehler beim Speichern des Dashboards.')
    }
  }

  const sectionHeaderStyle = "text-2xl font-bold mb-6"

  return (
    <div className="min-h-screen p-8 font-sans" style={{ backgroundColor }} ref={dashboardRef}>
      <div className="max-w-6xl mx-auto">
        <header className="mb-16">
          <h1 className="text-4xl font-bold mb-4" style={{ color: textColor1 }}>Immobilien-Dashboard</h1>
          <div className="flex justify-between items-center">
            <p className="text-sm" style={{ color: textColor2 }}>Überblick über Ihre Immobilienaktivitäten</p>
            <div className="space-x-4">
              <Button variant="outline" className="border-gray-300 hover:bg-gray-200" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
              <Button className="bg-gray-900 text-white hover:bg-gray-800" onClick={() => handleDownload('png')}>
                <Download className="h-4 w-4 mr-2" />
                PNG
              </Button>
              <Button className="bg-gray-700 text-white hover:bg-gray-600" onClick={() => handleDownload('jpeg')}>
                <Download className="h-4 w-4 mr-2" />
                JPEG
              </Button>
            </div>
          </div>
        </header>

        <div ref={contentRef}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="border-none shadow-sm" style={{ backgroundColor: backgroundColor2 }}>
              <CardContent className="p-6">
                <h2 className={sectionHeaderStyle} style={{ color: textColor1 }}>Hausansicht</h2>
                {image ? (
                  <img src={image} alt="Hausansicht" className="w-full h-48 object-cover rounded-md" />
                ) : (
                  <div className="bg-gray-100 h-48 rounded-md flex items-center justify-center">
                    <Home size={48} className="text-gray-400" />
                  </div>
                )}
              </CardContent>
            </Card>

            {hasStats ? (
              <Card className="border-none shadow-sm" style={{ backgroundColor: backgroundColor2 }}>
                <CardContent className="p-6 flex flex-col h-full">
                  <h2 className={sectionHeaderStyle} style={{ color: textColor1 }}>Performance</h2>
                  <div className="flex-grow flex flex-col justify-between">
                    <div className="flex items-center justify-between py-4 border-b">
                      <div className="flex items-center">
                        <Users className="h-8 w-8 mr-4 text-blue-500" />
                        <span className="text-xl" style={{ color: textColor2 }}>Besucher</span>
                      </div>
                      <span className="text-2xl font-medium" style={{ color: textColor1 }}>{mostRecentStats.besucher}</span>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b">
                      <div className="flex items-center">
                        <Bookmark className="h-8 w-8 mr-4 text-green-500" />
                        <span className="text-xl" style={{ color: textColor2 }}>Lesezeichen</span>
                      </div>
                      <span className="text-2xl font-medium" style={{ color: textColor1 }}>{mostRecentStats.lesezeichen}</span>
                    </div>
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-center">
                        <UserCheck className="h-8 w-8 mr-4 text-purple-500" />
                        <span className="text-xl" style={{ color: textColor2 }}>Bewerber</span>
                      </div>
                      <span className="text-2xl font-medium" style={{ color: textColor1 }}>{mostRecentStats.bewerber}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-sm" style={{ backgroundColor: backgroundColor2 }}>
                <CardContent className="p-6 flex flex-col h-full justify-center items-center">
                  <h2 className={sectionHeaderStyle} style={{ color: textColor1 }}>Performance</h2>
                  <p style={{ color: textColor2 }}>Keine Daten verfügbar</p>
                </CardContent>
              </Card>
            )}

            <Card className="border-none shadow-sm" style={{ backgroundColor: backgroundColor2 }}>
              <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                <h2 className={sectionHeaderStyle} style={{ color: textColor1 }}>Attraktivität</h2>
                {hasStats ? (
                  <>
                    <div className="relative w-40 h-40">
                      <svg width="160" height="160" viewBox="0 0 160 160">
                        <defs>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        <circle cx="80" cy="80" r="70" fill={attraktivitaetColor} filter="url(#glow)" />
                        <text x="80" y="80" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="40" fontWeight="300">
                          {formatAttraktivitaet(attraktivitaet)}%
                        </text>
                      </svg>
                    </div>
                    <p className="mt-4 text-sm" style={{ color: textColor2 }}>
                      {attraktivitaetsSettings.calculation === 'bewerberLesezeichen' ? 'Bewerber / Lesezeichen' : 'Bewerber / Aufrufe'}
                    </p>
                  </>
                ) : (
                  <p style={{ color: textColor2 }}>Keine Daten verfügbar</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mb-16">
            <h2 className={`${sectionHeaderStyle} px-4`} style={{ color: textColor1 }}>Kaufangebote</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4" style={{ backgroundColor: 'white' }}>
              {sortedKaufangebote.slice(0, 3).map((angebot, index) => (
                <div key={index} className={`rounded-lg shadow-lg overflow-hidden ${getKaufangebotStyle(angebot, index)}`}>
                  <div className="p-6 text-white">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs opacity-75 mb-1">Kaufangebot</p>
                        <p className="text-2xl font-light">{angebot.betrag.toLocaleString()} €</p>
                      </div>
                      {angebot.empfehlung ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <X className="h-6 w-6" />
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>Finanzierung: {angebot.finanzierung}</p>
                      <p>Gültig bis: {angebot.gueltigBis}</p>
                    </div>
                  </div>
                  <div className={`p-4 ${angebot.empfehlung ? (index === 0 ? 'bg-yellow-600' : index === 1 ? 'bg-gray-600' : 'bg-orange-800') : 'bg-orange-800'} bg-opacity-30`}>
                    <p className="text-xs font-medium text-white">
                      {angebot.empfehlung ? 'Empfohlen' : 'Nicht empfohlen'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="border-none shadow-sm" style={{ backgroundColor: backgroundColor2 }}>
              <CardContent className="p-6">
                <h2 className={sectionHeaderStyle} style={{ color: textColor1 }}>Kennzahlen-Verlauf</h2>
                {hasStats ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sortedStatsHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="date" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="lesezeichen" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="bewerber" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{ color: textColor2 }}>Keine Daten verfügbar</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm" style={{ backgroundColor: backgroundColor2 }}>
              <CardContent className="p-6">
                <h2 className={sectionHeaderStyle} style={{ color: textColor1 }}>Absagegründe</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(absageGruende).map(([name, value]) => ({ name, value }))} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis type="number" stroke="#9ca3af" />
                      <YAxis dataKey="name" type="category" width={100} stroke="#9ca3af" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}