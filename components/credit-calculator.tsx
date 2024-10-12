"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const STATES: { [key: string]: number } = {
  "Baden-Württemberg": 5.0,
  "Bayern": 3.5,
  "Berlin": 6.0,
  "Brandenburg": 6.5,
  "Bremen": 5.0,
  "Hamburg": 4.5,
  "Hessen": 6.0,
  "Mecklenburg-Vorpommern": 6.5,
  "Niedersachsen": 5.0,
  "Nordrhein-Westfalen": 6.5,
  "Rheinland-Pfalz": 5.0,
  "Saarland": 6.5,
  "Sachsen": 3.5,
  "Sachsen-Anhalt": 5.0,
  "Schleswig-Holstein": 6.5,
  "Thüringen": 6.5
}

function formatNumber(num: number): string {
  return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CreditCalculator() {
  const [purchasePrice, setPurchasePrice] = useState<number>(0)
  const [brokerFee, setBrokerFee] = useState<number>(0)
  const [selectedState, setSelectedState] = useState<string>("")
  const [propertyTransferTax, setPropertyTransferTax] = useState<number>(0)
  const [notaryFee] = useState<number>(1.5)
  const [totalCost, setTotalCost] = useState<number>(0)
  const [additionalCosts, setAdditionalCosts] = useState<number>(0)
  const [interestRate, setInterestRate] = useState<number>(0)
  const [repaymentRate, setRepaymentRate] = useState<number>(0)
  const [financingAmount, setFinancingAmount] = useState<number>(100)
  const [absoluteFinancingAmount, setAbsoluteFinancingAmount] = useState<number>(0)
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0)
  const [yearlyPayment, setYearlyPayment] = useState<number>(0)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    const notaryAndRegistrationFee = purchasePrice * (notaryFee / 100)
    const transferTax = purchasePrice * (propertyTransferTax / 100)
    const brokerCost = purchasePrice * (brokerFee / 100)
    const additionalCostsSum = notaryAndRegistrationFee + transferTax + brokerCost
    const total = purchasePrice + additionalCostsSum
    setTotalCost(total)
    setAdditionalCosts(additionalCostsSum)

    const baseFinanceAmount = purchasePrice
    const additionalFinanceAmount = (financingAmount > 100) 
      ? (financingAmount - 100) / 100 * additionalCostsSum 
      : 0
    const totalFinanceAmount = (financingAmount / 100) * purchasePrice + additionalFinanceAmount
    setAbsoluteFinancingAmount(totalFinanceAmount)
  }, [purchasePrice, brokerFee, propertyTransferTax, notaryFee, financingAmount])

  const calculateCredit = () => {
    const totalRate = (interestRate + repaymentRate) / 100
    const yearlyPayment = absoluteFinancingAmount * totalRate
    const monthlyPayment = yearlyPayment / 12

    setMonthlyPayment(monthlyPayment)
    setYearlyPayment(yearlyPayment)

    // Debug information
    const debugText = `
      Purchase Price: ${formatNumber(purchasePrice)} €
      Additional Costs: ${formatNumber(additionalCosts)} €
      Total Cost: ${formatNumber(totalCost)} €
      Financing Amount (%): ${financingAmount}%
      Absolute Financing Amount: ${formatNumber(absoluteFinancingAmount)} €
      Annual Interest Rate: ${interestRate}%
      Annual Repayment Rate: ${repaymentRate}%
      Total Annual Rate: ${totalRate * 100}%
      Calculated Yearly Payment: ${formatNumber(yearlyPayment)} €
      Calculated Monthly Payment: ${formatNumber(monthlyPayment)} €
    `
    setDebugInfo(debugText)
    console.log(debugText)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
      <CardHeader className="bg-blue-500 text-white p-6 rounded-t-lg">
        <CardTitle className="text-3xl font-bold">Kreditrechner</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label htmlFor="purchasePrice" className="text-lg font-semibold">Kaufpreis (€)</Label>
            <Input
              id="purchasePrice"
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              className="text-lg"
            />
          </div>
          <div className="space-y-4">
            <Label htmlFor="brokerFee" className="text-lg font-semibold">Maklergebühr (%)</Label>
            <Input
              id="brokerFee"
              type="number"
              value={brokerFee}
              onChange={(e) => setBrokerFee(Number(e.target.value))}
              className="text-lg"
            />
          </div>
          <div className="space-y-4">
            <Label htmlFor="state" className="text-lg font-semibold">Bundesland</Label>
            <Select onValueChange={(value: string) => {
              setSelectedState(value)
              setPropertyTransferTax(STATES[value])
            }}>
              <SelectTrigger id="state" className="text-lg">
                <SelectValue placeholder="Wählen Sie ein Bundesland" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(STATES).map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <h3 className="text-xl font-bold">Nebenkosten</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Maklergebühr:</span>
              <span>{brokerFee}% ({formatNumber(purchasePrice * brokerFee / 100)} €)</span>
            </div>
            {selectedState && (
              <div className="flex justify-between items-center">
                <span className="font-semibold">Grunderwerbsteuer:</span>
                <span>{propertyTransferTax}% ({formatNumber(purchasePrice * propertyTransferTax / 100)} €)</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-semibold">Notar- & Grundbucheintrag:</span>
              <span>{notaryFee}% ({formatNumber(purchasePrice * notaryFee / 100)} €)</span>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-4 rounded-lg">
          <h3 className="text-xl font-bold mb-2">Gesamtkosten</h3>
          <p className="text-2xl font-bold text-secondary-foreground">{formatNumber(totalCost)} €</p>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Label htmlFor="interestRate" className="text-lg font-semibold">Zins (%)</Label>
            <Input
              id="interestRate"
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="text-lg"
            />
          </div>
          <div className="space-y-4">
            <Label htmlFor="repaymentRate" className="text-lg font-semibold">Tilgung (%)</Label>
            <Input
              id="repaymentRate"
              type="number"
              value={repaymentRate}
              onChange={(e) => setRepaymentRate(Number(e.target.value))}
              className="text-lg"
            />
          </div>
          <div className="space-y-4">
            <Label htmlFor="financingAmount" className="text-lg font-semibold">Finanzierungssumme (%)</Label>
            <Input
              id="financingAmount"
              type="number"
              value={financingAmount}
              onChange={(e) => setFinancingAmount(Number(e.target.value))}
              className="text-lg"
            />
          </div>
        </div>

        <div className="bg-secondary p-4 rounded-lg">
          <h3 className="text-xl font-bold mb-2">Absolute Finanzierungssumme</h3>
          <p className="text-2xl font-bold text-secondary-foreground">{formatNumber(absoluteFinancingAmount)} €</p>
        </div>

        <Button onClick={calculateCredit} className="w-full text-lg py-6 bg-blue-500 hover:bg-blue-600 text-white">Berechnen</Button>

        {monthlyPayment > 0 && (
          <div className="bg-primary text-primary-foreground p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-bold">Kreditbelastung</h3>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Monatlich:</span>
              <span className="text-2xl font-bold">{formatNumber(monthlyPayment)} €</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Jährlich:</span>
              <span className="text-2xl font-bold">{formatNumber(yearlyPayment)} €</span>
            </div>
          </div>
        )}

        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-bold mb-2">Debug Information:</h4>
            <pre className="whitespace-pre-wrap">{debugInfo}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}