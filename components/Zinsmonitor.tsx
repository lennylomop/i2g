"use client"

import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Beispieldaten - Sie würden diese in der Praxis aus einer externen Quelle laden
const fullData = [
  { datum: '2013-10-01', zins: 2.5 },
  { datum: '2014-10-01', zins: 2.3 },
  { datum: '2015-10-01', zins: 1.8 },
  { datum: '2016-10-01', zins: 1.5 },
  { datum: '2017-10-01', zins: 1.7 },
  { datum: '2018-10-01', zins: 1.9 },
  { datum: '2019-10-01', zins: 1.4 },
  { datum: '2020-10-01', zins: 1.1 },
  { datum: '2021-10-01', zins: 1.2 },
  { datum: '2022-10-01', zins: 2.8 },
  { datum: '2023-10-01', zins: 3.5 },
  { datum: '2024-07-08', zins: 4.1 },
  { datum: '2024-07-15', zins: 3.95 },
  { datum: '2024-07-22', zins: 3.89 },
  { datum: '2024-07-29', zins: 3.96 },
  { datum: '2024-08-05', zins: 3.83 },
  { datum: '2024-08-12', zins: 3.77 },
  { datum: '2024-08-19', zins: 3.72 },
  { datum: '2024-08-26', zins: 3.71 },
  { datum: '2024-09-02', zins: 3.74 },
  { datum: '2024-09-09', zins: 3.76 },
  { datum: '2024-09-16', zins: 3.64 },
  { datum: '2024-09-23', zins: 3.68 },
  { datum: '2024-09-30', zins: 3.64 },
]

export default function ErweiterterZinsmonitor() {
  const [selectedPeriod, setSelectedPeriod] = useState(0.25) // 3 months as default
  const [data] = useState(fullData)

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime())
  }, [data])

  const filteredData = useMemo(() => {
    const currentDate = new Date()
    const oldestDate = new Date(currentDate.getFullYear() - selectedPeriod, currentDate.getMonth(), currentDate.getDate())
    return sortedData.filter(item => new Date(item.datum) >= oldestDate)
  }, [sortedData, selectedPeriod])

  const yAxisDomain = useMemo(() => {
    if (filteredData.length === 0) return [0, 5]
    const minZins = Math.min(...filteredData.map(item => item.zins))
    const maxZins = Math.max(...filteredData.map(item => item.zins))
    const padding = (maxZins - minZins) * 0.1 // 10% padding
    return [Math.max(0, minZins - padding), maxZins + padding]
  }, [filteredData])

  const handlePeriodSelection = (period: number) => {
    setSelectedPeriod(period)
  }

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem)
    if (selectedPeriod <= 0.25) {
      return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })
    } else if (selectedPeriod <= 1) {
      return date.toLocaleDateString('de-DE', { month: 'short' })
    } else if (selectedPeriod <= 5) {
      return date.toLocaleDateString('de-DE', { year: '2-digit', month: 'short' })
    } else {
      return date.getFullYear().toString()
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto font-sans">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Zinsmonitor</CardTitle>
        <div className="flex space-x-2 mt-2">
          {[
            { label: '3 Monate', value: 0.25 },
            { label: '1 Jahr', value: 1 },
            { label: '3 Jahre', value: 3 },
            { label: '5 Jahre', value: 5 },
            { label: '10 Jahre', value: 10 }
          ].map((period) => (
            <Button
              key={period.value}
              onClick={() => handlePeriodSelection(period.value)}
              variant={selectedPeriod === period.value ? "default" : "outline"}
              className={selectedPeriod === period.value ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="datum" 
                tickFormatter={formatXAxis}
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                domain={yAxisDomain}
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
                tickFormatter={(tick) => `${tick.toFixed(2)}%`}
              />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(2)}%`}
                labelFormatter={(label) => `Datum: ${new Date(label).toLocaleDateString('de-DE')}`}
                contentStyle={{ backgroundColor: '#f3f4f6', border: 'none', borderRadius: '0.375rem' }}
              />
              <Line 
                type="monotone" 
                dataKey="zins" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Letzte Aktualisierung: {new Date(sortedData[sortedData.length - 1].datum).toLocaleDateString('de-DE')}
        </p>
      </CardContent>
    </Card>
  )
}