import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from '@/lib/store'
import { X } from 'lucide-react'

export default function InputPage() {
  const { 
    currentStats, 
    setCurrentStats, 
    absageGruende, 
    setAbsageGruende, 
    currentAngebot, 
    setCurrentAngebot, 
    addKaufangebot, 
    removeKaufangebot,
    kaufangebote,
    addStatsHistory,
    updateStatsHistory,
    removeStatsHistory,
    setImage,
    updateColors,
    backgroundColor,
    backgroundColor2,
    textColor1,
    textColor2,
    statsHistory,
    updateLatestStats,
    latestStats,
    addDashboard,
    currentDashboard,
    setCurrentDashboard,
    saveDashboard,
    attraktivitaetsSettings,
    updateAttraktivitaetsSettings
  } = useStore()

  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({})
  const [dashboardName, setDashboardName] = useState('')

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setCurrentStats((prev: any) => ({ ...prev, date: today }))
  }, [setCurrentStats])

  const handleStatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const newValue = name === 'date' ? value : parseInt(value) || 0
    setCurrentStats({ ...currentStats, [name]: newValue })
    updateLatestStats({ [name]: newValue })
  }

  const handleAbsageGruendeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setAbsageGruende({ ...absageGruende, [name]: parseInt(value) || 0 })
  }

  const handleAngebotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCurrentAngebot({ ...currentAngebot, [name]: name === 'betrag' ? parseInt(value) || 0 : value })
  }

  const handleAngebotSelect = (value: string) => {
    setCurrentAngebot({ ...currentAngebot, finanzierung: value as 'vorhanden' | 'ausstehend' | 'unwahrscheinlich' })
  }

  const handleEmpfehlungChange = () => {
    setCurrentAngebot({ ...currentAngebot, empfehlung: !currentAngebot.empfehlung })
  }

  const handleSaveStats = () => {
    addStatsHistory(currentStats)
  }

  const handleSaveAngebot = () => {
    addKaufangebot(currentAngebot)
    setCurrentAngebot({
      betrag: 0,
      finanzierung: 'ausstehend',
      gueltigBis: new Date().toISOString().split('T')[0],
      empfehlung: false
    })
  }

  const handleDeleteAngebot = (index: number) => {
    removeKaufangebot(index)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleColorSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateColors(backgroundColor, backgroundColor2, textColor1, textColor2)
  }

  const handleEdit = (index: number) => {
    setEditMode(prev => ({ ...prev, [index]: true }))
  }

  const handleSave = (index: number) => {
    const updatedStats = {
      ...statsHistory[index],
      besucher: parseInt(statsHistory[index].besucher.toString()),
      lesezeichen: parseInt(statsHistory[index].lesezeichen.toString()),
      bewerber: parseInt(statsHistory[index].bewerber.toString())
    }
    updateStatsHistory(index, updatedStats)
    setEditMode(prev => ({ ...prev, [index]: false }))
  }

  const handleDelete = (index: number) => {
    removeStatsHistory(index)
  }

  const handleCreateDashboard = () => {
    if (dashboardName) {
      const newDashboardId = addDashboard(dashboardName)
      setCurrentDashboard(newDashboardId)
      setDashboardName('')
    }
  }

  const handleSaveDashboard = () => {
    if (currentDashboard) {
      saveDashboard(currentDashboard, {
        stats: latestStats,
        absageGruende,
        kaufangebote: [],
        image: null
      })
    }
  }

  const handleAttraktivitaetsSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateAttraktivitaetsSettings({ [name]: value });
  };

  const formatNumber = (value: number | string) => {
    if (typeof value === 'number') {
      return value.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    return value;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Daten-Eingabe</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Dashboard erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Dashboard Name"
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
            />
            <Button onClick={handleCreateDashboard} className="bg-blue-500 hover:bg-blue-600 text-white font-sans">Erstellen</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Dashboard-Farben</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleColorSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Hintergrundfarbe</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => updateColors(e.target.value, backgroundColor2, textColor1, textColor2)}
                  className="w-12 h-12 p-0 border-0"
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => updateColors(e.target.value, backgroundColor2, textColor1, textColor2)}
                  placeholder="#farbcode"
                  className="flex-grow"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backgroundColor2">Hintergrundfarbe 2 (Karten)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="backgroundColor2"
                  type="color"
                  value={backgroundColor2}
                  onChange={(e) => updateColors(backgroundColor, e.target.value, textColor1, textColor2)}
                  className="w-12 h-12 p-0 border-0"
                />
                <Input
                  type="text"
                  value={backgroundColor2}
                  onChange={(e) => updateColors(backgroundColor, e.target.value, textColor1, textColor2)}
                  placeholder="#farbcode"
                  className="flex-grow"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="textColor1">Schriftfarbe 1 (Überschriften)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="textColor1"
                  type="color"
                  value={textColor1}
                  onChange={(e) => updateColors(backgroundColor, backgroundColor2, e.target.value, textColor2)}
                  className="w-12 h-12 p-0 border-0"
                />
                <Input
                  type="text"
                  value={textColor1}
                  onChange={(e) => updateColors(backgroundColor, backgroundColor2, e.target.value, textColor2)}
                  placeholder="#farbcode"
                  className="flex-grow"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="textColor2">Schriftfarbe 2 (Andere Texte)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="textColor2"
                  type="color"
                  value={textColor2}
                  onChange={(e) => updateColors(backgroundColor, backgroundColor2, textColor1, e.target.value)}
                  className="w-12 h-12 p-0 border-0"
                />
                <Input
                  type="text"
                  value={textColor2}
                  onChange={(e) => updateColors(backgroundColor, backgroundColor2, textColor1, e.target.value)}
                  placeholder="#farbcode"
                  className="flex-grow"
                />
              </div>
            </div>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-sans">Farben anwenden</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">Bild hochladen</h2>
          <Input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload}
          />
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">Inseratkennzahlen</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Datum</Label>
              <Input 
                id="date" 
                name="date" 
                type="date" 
                value={currentStats.date} 
                onChange={handleStatsChange}
              />
            </div>
            <div>
              <Label htmlFor="besucher">Besucher</Label>
              <Input 
                id="besucher" 
                name="besucher" 
                type="number" 
                value={currentStats.besucher} 
                onChange={handleStatsChange}
              />
            </div>
            <div>
              <Label htmlFor="lesezeichen">Lesezeichen</Label>
              <Input 
                id="lesezeichen" 
                name="lesezeichen" 
                type="number"
                value={currentStats.lesezeichen} 
                onChange={handleStatsChange}
              />
            </div>
            <div>
              <Label htmlFor="bewerber">Bewerber</Label>
              <Input 
                id="bewerber" 
                name="bewerber" 
                type="number" 
                value={currentStats.bewerber} 
                onChange={handleStatsChange}
              />
            </div>
            <Button onClick={handleSaveStats} className="bg-blue-500 hover:bg-blue-600 text-white font-sans">Speichern</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Eingegebene Kennzahlen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statsHistory.map((stats, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">{stats.date}</h3>
                  <div>
                    {!editMode[index] && (
                      <Button variant="outline" size="sm" className="mr-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-sans" onClick={() => handleEdit(index)}>
                        Bearbeiten
                      </Button>
                    )}
                    {editMode[index] && (
                      <Button variant="outline" size="sm" className="mr-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-sans" onClick={() => handleSave(index)}>
                        Speichern
                      </Button>
                    )}
                    <Button variant="destructive" size="sm" className="font-sans" onClick={() => handleDelete(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`besucher-${index}`}>Besucher</Label>
                    <Input
                      id={`besucher-${index}`}
                      type="number"
                      value={stats.besucher}
                      onChange={(e) => updateStatsHistory(index, { ...stats, besucher: parseInt(e.target.value) })}
                      disabled={!editMode[index]}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`lesezeichen-${index}`}>Lesezeichen</Label>
                    <Input
                      id={`lesezeichen-${index}`}
                      type="number"
                      value={stats.lesezeichen}
                      onChange={(e) => updateStatsHistory(index, { ...stats, lesezeichen: parseInt(e.target.value) })}
                      disabled={!editMode[index]}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`bewerber-${index}`}>Bewerber</Label>
                    <Input
                      id={`bewerber-${index}`}
                      type="number"
                      value={stats.bewerber}
                      onChange={(e) => updateStatsHistory(index, { ...stats, bewerber: parseInt(e.target.value) })}
                      disabled={!editMode[index]}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">Angebot hinzufügen</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="betrag">Betrag (€)</Label>
              <Input 
                id="betrag" 
                name="betrag" 
                type="number" 
                value={currentAngebot.betrag}
                onChange={handleAngebotChange}
              />
            </div>
            <div>
              <Label htmlFor="finanzierung">Finanzierung</Label>
              <Select onValueChange={handleAngebotSelect} value={currentAngebot.finanzierung}>
                <SelectTrigger>
                  <SelectValue placeholder="Finanzierungsstatus wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vorhanden">Finanzierungsbestätigung vorhanden</SelectItem>
                  <SelectItem value="ausstehend">Finanzierungsbestätigung steht aus</SelectItem>
                  <SelectItem value="unwahrscheinlich">Wahrscheinlich nicht finanzierbar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gueltigBis">Gültig bis</Label>
              <Input 
                id="gueltigBis" 
                name="gueltigBis" 
                type="date" 
                value={currentAngebot.gueltigBis}
                onChange={handleAngebotChange}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="empfehlung"
                checked={currentAngebot.empfehlung}
                onChange={handleEmpfehlungChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="empfehlung">Makler empfiehlt Annahme</Label>
            </div>
            <Button onClick={handleSaveAngebot} className="bg-blue-500 hover:bg-blue-600 text-white font-sans">Angebot speichern</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Gespeicherte Angebote</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kaufangebote.map((angebot, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Angebot {index + 1}</h3>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteAngebot(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <p>Betrag: {angebot.betrag} €</p>
                  <p>Finanzierung: {angebot.finanzierung}</p>
                  <p>Gültig bis: {angebot.gueltigBis}</p>
                  <p>Empfehlung: {angebot.empfehlung ? 'Ja' : 'Nein'}</p>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">Absagegründe</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lage">Lage</Label>
              <Input 
                id="lage" 
                name="lage" 
                type="number" 
                value={absageGruende.lage} 
                onChange={handleAbsageGruendeChange}
              />
            </div>
            <div>
              <Label htmlFor="preis">Preis</Label>
              <Input 
                id="preis" 
                name="preis" 
                type="number" 
                value={absageGruende.preis} 
                onChange={handleAbsageGruendeChange}
              />
            </div>
            <div>
              <Label htmlFor="zustand">Zustand</Label>
              <Input 
                id="zustand" 
                name="zustand" 
                type="number" 
                value={absageGruende.zustand} 
                onChange={handleAbsageGruendeChange}
              />
            </div>
            <div>
              <Label htmlFor="sonstiges">Sonstiges</Label>
              <Input 
                id="sonstiges" 
                name="sonstiges" 
                type="number" 
                value={absageGruende.sonstiges} 
                onChange={handleAbsageGruendeChange}
              />
            </div>
            <div>
              <Label htmlFor="keineRueckmeldung">Keine Rückmeldung</Label>
              <Input 
                id="keineRueckmeldung" 
                name="keineRueckmeldung" 
                type="number" 
                value={absageGruende.keineRueckmeldung} 
                onChange={handleAbsageGruendeChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Attraktivitätskreis-Einstellungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="calculation">Berechnungsmethode</Label>
              <Select
                name="calculation"
                value={attraktivitaetsSettings.calculation}
                onValueChange={(value) => updateAttraktivitaetsSettings({ calculation: value as 'bewerberLesezeichen' | 'bewerberAufrufe' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Berechnungsmethode wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bewerberLesezeichen">Bewerber / Lesezeichen</SelectItem>
                  <SelectItem value="bewerberAufrufe">Bewerber / Aufrufe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="greenThreshold">Grüner Bereich (ab)</Label>
              <Input
                id="greenThreshold"
                name="greenThreshold"
                type="number"
                step="0.1"
                value={attraktivitaetsSettings.greenThreshold}
                onChange={handleAttraktivitaetsSettingsChange}
              />
            </div>
            <div>
              <Label htmlFor="yellowThreshold">Gelber Bereich (ab)</Label>
              <Input
                id="yellowThreshold"
                name="yellowThreshold"
                type="number"
                step="0.1"
                value={attraktivitaetsSettings.yellowThreshold}
                onChange={handleAttraktivitaetsSettingsChange}
              />
            </div>
            <div>
              <Label htmlFor="redThreshold">Roter Bereich (unter)</Label>
              <Input
                id="redThreshold"
                name="redThreshold"
                type="number"
                step="0.1"
                value={attraktivitaetsSettings.redThreshold}
                onChange={handleAttraktivitaetsSettingsChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold mb-4">Dashboard speichern</h2>
          <Button onClick={handleSaveDashboard} className="bg-blue-500 hover:bg-blue-600 text-white font-sans">Aktuelles Dashboard speichern</Button>
        </CardContent>
      </Card>
    </div>
  )
}