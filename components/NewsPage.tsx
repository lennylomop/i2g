import React, { useState } from 'react'
import Image from 'next/image'
import { X, ChevronRight, Download, BarChart } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import ZinsmonitorComponent from './Zinsmonitor'

interface NewsItem {
  id: number
  title: string
  content: string
  image: string
  date: string
}

const dummyNews: NewsItem[] = [
  { id: 1, title: "Immobilienmarkt boomt trotz Krise", content: "Der Immobilienmarkt zeigt sich weiterhin robust...", image: "/placeholder.svg?height=400&width=600", date: "2023-05-01" },
  { id: 2, title: "Neue Gesetze für Makler", content: "Ab nächstem Monat treten neue Regelungen für Makler in Kraft...", image: "/placeholder.svg?height=400&width=600", date: "2023-05-02" },
  { id: 3, title: "Trend zu nachhaltigen Gebäuden", content: "Immer mehr Investoren setzen auf nachhaltige Immobilien...", image: "/placeholder.svg?height=400&width=600", date: "2023-05-03" },
  { id: 4, title: "Digitalisierung in der Immobilienbranche", content: "Die Digitalisierung verändert die Arbeit von Maklern grundlegend...", image: "/placeholder.svg?height=400&width=600", date: "2023-05-04" },
  { id: 5, title: "Auswirkungen der Zinspolitik auf den Immobilienmarkt", content: "Die jüngsten Zinserhöhungen der EZB haben spürbare Auswirkungen...", image: "/placeholder.svg?height=400&width=600", date: "2023-05-05" },
  { id: 6, title: "Trends im Büroimmobilienmarkt nach COVID-19", content: "Die Pandemie hat die Anforderungen an Büroflächen nachhaltig verändert...", image: "/placeholder.svg?height=400&width=600", date: "2023-05-06" },
]

export default function NewsPage() {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  const [showAllArticles, setShowAllArticles] = useState(false)

  const openNewsModal = (news: NewsItem) => {
    setSelectedNews(news)
  }

  const closeNewsModal = () => {
    setSelectedNews(null)
  }

  const toggleAllArticles = () => {
    setShowAllArticles(!showAllArticles)
  }

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      {!showAllArticles ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Hauptnachricht */}
          <Card className="col-span-1 cursor-pointer hover:shadow-lg transition-shadow duration-300" onClick={() => openNewsModal(dummyNews[0])}>
            <CardContent className="p-0">
              <Image src={dummyNews[0].image} alt={dummyNews[0].title} width={600} height={400} className="w-full h-64 object-cover rounded-t-lg" />
            </CardContent>
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">{dummyNews[0].title}</CardTitle>
              <CardDescription>{dummyNews[0].date}</CardDescription>
            </CardHeader>
          </Card>

          {/* Weitere Nachrichten und "Alle Artikel anzeigen" Button */}
          <div className="col-span-1 space-y-4">
            {dummyNews.slice(1, 4).map((news) => (
              <Card key={news.id} className="cursor-pointer hover:shadow-md transition-shadow duration-300" onClick={() => openNewsModal(news)}>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">{news.title}</CardTitle>
                  <CardDescription>{news.date}</CardDescription>
                </CardHeader>
              </Card>
            ))}
            <Button onClick={toggleAllArticles} className="w-full group" variant="outline">
              Alle Artikel anzeigen
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Wochenreport Download */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Wochenreport</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Button variant="default" className="bg-blue-500 hover:bg-blue-600 text-white font-sans">
                <Download className="mr-2 h-4 w-4" />
                Herunterladen
              </Button>
              <Image src="/placeholder.svg?height=100&width=100" alt="Wochenreport Titelbild" width={100} height={100} className="rounded-md" />
            </CardContent>
          </Card>

          {/* Zinsmonitor */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <ZinsmonitorComponent />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Alle Artikel</h2>
            <Button onClick={toggleAllArticles} variant="outline">Zurück zur Übersicht</Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dummyNews.map((news) => (
              <Card key={news.id} className="cursor-pointer hover:shadow-lg transition-shadow duration-300" onClick={() => openNewsModal(news)}>
                <CardContent className="p-0">
                  <Image src={news.image} alt={news.title} width={400} height={200} className="w-full h-48 object-cover rounded-t-lg" />
                </CardContent>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">{news.title}</CardTitle>
                  <CardDescription>{news.date}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* News Modal */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeNewsModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 flex justify-end p-4 border-b">
              <Button variant="ghost" size="icon" onClick={closeNewsModal} aria-label="Schließen">
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="p-6">
              <Image src={selectedNews.image} alt={selectedNews.title} width={800} height={400} className="w-full h-64 object-cover rounded-lg mb-6" />
              <h2 className="text-3xl font-bold mb-4">{selectedNews.title}</h2>
              <p className="text-sm text-gray-500 mb-4">{selectedNews.date}</p>
              <p className="text-lg leading-relaxed">{selectedNews.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}