"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Download, Save, Trash2, Undo, Redo, RotateCw, ZoomIn, ZoomOut, DoorOpen, Square, Type, Minus } from 'lucide-react';

interface Punkt {
  x: number;
  y: number;
}

interface Element {
  id: string;
  typ: 'linie' | 'tuer' | 'fenster' | 'text';
  start: Punkt;
  ende: Punkt;
  bezeichnung: string;
  laenge?: number;
  winkel?: number;
  istKonsistent?: boolean;
  text?: string;
}

interface Grundriss {
  id: string;
  name: string;
  elemente: Element[];
}

interface Aktion {
  typ: 'hinzufuegen' | 'loeschen' | 'aktualisieren' | 'verschieben';
  element: Element;
  altesElement?: Element;
}

interface Genauigkeit {
  einrastToleranz: number;
  laengenPraezision: number;
  winkelPraezision: number;
}

const EINRAST_SCHWELLE = 15;
const WINKEL_EINRAST_SCHWELLE = 5;
const LINIEN_DICKE = 3;
const TUER_DICKE = 5;
const FENSTER_DICKE = 5;
const PIXEL_PRO_METER = 10;
const BEZEICHNUNGS_RADIUS = 10;
const CANVAS_SKALIERUNG = 2;

const standardGenauigkeit: Genauigkeit = {
  einrastToleranz: 0.1,
  laengenPraezision: 0,
  winkelPraezision: 0
};

const istNaheHorizontalOderVertikal = (winkel: number): boolean => {
  return Math.abs(winkel % 90) < WINKEL_EINRAST_SCHWELLE || Math.abs(winkel % 90 - 90) < WINKEL_EINRAST_SCHWELLE;
};

const winkelEinrasten = (winkel: number): number => {
  return Math.round(winkel / 90) * 90;
};

const NORMALE_WINKEL_EINRAST_SCHWELLE = 5;
const SHIFT_WINKEL_EINRAST_SCHWELLE = 20;

const aufWinkelEinrasten = (start: Punkt, ende: Punkt, istShiftGedrueckt: boolean): Punkt => {
  const dx = ende.x - start.x;
  const dy = ende.y - start.y;
  let winkel = Math.atan2(dy, dx);
  
  const einrastWinkel = istShiftGedrueckt 
    ? [0, Math.PI/2, Math.PI, 3*Math.PI/2]
    : [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
  
  let naechsterWinkel = winkel;
  let minDifferenz = Math.PI * 2;
  
  einrastWinkel.forEach(snapWinkel => {
    const differenz = Math.abs((winkel + 2 * Math.PI) % (2 * Math.PI) - snapWinkel);
    if (differenz < minDifferenz) {
      minDifferenz = differenz;
      naechsterWinkel = snapWinkel;
    }
  });
  
  const schwelle = istShiftGedrueckt ? SHIFT_WINKEL_EINRAST_SCHWELLE : NORMALE_WINKEL_EINRAST_SCHWELLE;
  
  if (minDifferenz < schwelle * Math.PI / 180) {
    const laenge = Math.sqrt(dx * dx + dy * dy);
    return {
      x: start.x + laenge * Math.cos(naechsterWinkel),
      y: start.y + laenge * Math.sin(naechsterWinkel)
    };
  }
  
  return ende;
};

const useGrundrissZeichner = (anfangsGenauigkeit: Genauigkeit = standardGenauigkeit) => {
  const [elemente, setElemente] = useState<Element[]>([]);
  const [aktuellesElement, setAktuellesElement] = useState<Element | null>(null);
  const [naechsteBezeichnung, setNaechsteBezeichnung] = useState('A');
  const [istShiftGedrueckt, setIstShiftGedrueckt] = useState(false);
  const [gezogenesElementId, setGezogenesElementId] = useState<string | null>(null);
  const [zugStart, setZugStart] = useState<Punkt | null>(null);
  const [aktionen, setAktionen] = useState<Aktion[]>([]);
  const [wiederherstellungsAktionen, setWiederherstellungsAktionen] = useState<Aktion[]>([]);
  const [hervorgehobeneBezeichnung, setHervorgehobeneBezeichnung] = useState<string | null>(null);
  const [genauigkeit, setGenauigkeit] = useState<Genauigkeit>(anfangsGenauigkeit);
  const [skalierung, setSkalierung] = useState(1);
  const [aktuellesWerkzeug, setAktuellesWerkzeug] = useState<'linie' | 'tuer' | 'fenster' | 'text'>('linie');
  const [verwendeteBezeichnungen, setVerwendeteBezeichnungen] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleTastenDruck = (e: KeyboardEvent) => {
      if (e.shiftKey) setIstShiftGedrueckt(true);
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        rueckgaengig();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        wiederherstellen();
      }
    };
    const handleTastenLoslassen = (e: KeyboardEvent) => {
      if (!e.shiftKey) setIstShiftGedrueckt(false);
    };

    window.addEventListener('keydown', handleTastenDruck);
    window.addEventListener('keyup', handleTastenLoslassen);

    return () => {
      window.removeEventListener('keydown', handleTastenDruck);
      window.removeEventListener('keyup', handleTastenLoslassen);
    };
  }, []);

  const aufPunktEinrasten = (punkt: Punkt): Punkt => {
    let eingerasteterPunkt = { ...punkt };
    let minAbstand = Infinity;

    elemente.forEach(element => {
      const punkte = [element.start, element.ende];
      punkte.forEach(p => {
        const abstand = Math.sqrt(Math.pow(p.x - punkt.x, 2) + Math.pow(p.y - punkt.y, 2));
        if (abstand < minAbstand && abstand < EINRAST_SCHWELLE) {
          minAbstand = abstand;
          eingerasteterPunkt = { ...p };
        }
      });
    });

    return eingerasteterPunkt;
  };

  const aufParalleleLinie = (start: Punkt, ende: Punkt): Punkt => {
    let eingerastetesEnde = { ...ende };
    let minAbstand = Infinity;

    elemente.forEach(element => {
      if (element.typ === 'linie' || element.typ === 'tuer' || element.typ === 'fenster') {
        if (Math.abs(element.start.x - ende.x) < EINRAST_SCHWELLE) {
          const abstandZurLinie = Math.abs(element.start.x - ende.x);
          if (abstandZurLinie < minAbstand) {
            minAbstand = abstandZurLinie;
            eingerastetesEnde.x = element.start.x;
          }
        }
        if (Math.abs(element.start.y - ende.y) < EINRAST_SCHWELLE) {
          const abstandZurLinie = Math.abs(element.start.y - ende.y);
          if (abstandZurLinie < minAbstand) {
            minAbstand = abstandZurLinie;
            eingerastetesEnde.y = element.start.y;
          }
        }
      }
    });

    return minAbstand < EINRAST_SCHWELLE ? eingerastetesEnde : ende;
  };

  const abstand = (p1: Punkt, p2: Punkt): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const zeichnenStarten = (x: number, y: number) => {
    const eingerasteterPunkt = aufPunktEinrasten({ x, y });
    setAktuellesElement({ 
      id: Date.now().toString(),
      typ: aktuellesWerkzeug,
      start: eingerasteterPunkt, 
      ende: eingerasteterPunkt, 
      bezeichnung: naechsteBezeichnung, 
      laenge: 0, 
      winkel: 0 
    });
  };

  const zeichnen = (x: number, y: number) => {
    if (aktuellesElement) {
      let endPunkt = { x, y };

      endPunkt = aufWinkelEinrasten(aktuellesElement.start, endPunkt, istShiftGedrueckt);
      
      if (istShiftGedrueckt) {
        endPunkt = aufParalleleLinie(aktuellesElement.start, endPunkt);
      }

      const laenge = Math.round(abstand(aktuellesElement.start, endPunkt) / PIXEL_PRO_METER);
      const endWinkel = Math.round(winkelBerechnen(aktuellesElement.start, endPunkt));
      
      setAktuellesElement({ ...aktuellesElement, ende: endPunkt, laenge, winkel: endWinkel });
    }
  };

  const zeichnenBeenden = () => {
    if (aktuellesElement) {
      if (aktuellesElement.typ === 'text') {
        const text = prompt('Geben Sie den Text für diese Beschriftung ein:');
        if (text) {
          const neuesElement = { ...aktuellesElement, text };
          setElemente([...elemente, neuesElement]);
          setAktionen([...aktionen, { typ: 'hinzufuegen', element: neuesElement }]);
          setWiederherstellungsAktionen([]);
        }
      } else {
        setElemente([...elemente, aktuellesElement]);
        setAktionen([...aktionen, { typ: 'hinzufuegen', element: aktuellesElement }]);
        setWiederherstellungsAktionen([]);
        setVerwendeteBezeichnungen(new Set(verwendeteBezeichnungen).add(aktuellesElement.bezeichnung));
      }
      setAktuellesElement(null);
      naechsteBezeichnungAktualisieren();
    }
  };

  const naechsteBezeichnungAktualisieren = () => {
    let naechsteVerfuegbareBezeichnung = 'A';
    while (verwendeteBezeichnungen.has(naechsteVerfuegbareBezeichnung)) {
      if (naechsteVerfuegbareBezeichnung === 'Z') {
        naechsteVerfuegbareBezeichnung = 'AA';
      } else if (naechsteVerfuegbareBezeichnung.endsWith('Z')) {
        naechsteVerfuegbareBezeichnung = naechsteVerfuegbareBezeichnung.slice(0, -1) + 'AA';
      } else {
        naechsteVerfuegbareBezeichnung = naechsteVerfuegbareBezeichnung.slice(0, -1) + String.fromCharCode(naechsteVerfuegbareBezeichnung.charCodeAt(naechsteVerfuegbareBezeichnung.length - 1) + 1);
      }
    }
    setNaechsteBezeichnung(naechsteVerfuegbareBezeichnung);
  };

  const elementLaengeAktualisieren = (id: string, neueLaenge: number) => {
    const aktualisiertesElement = elemente.map(element => {
      if (element.id === id) {
        const altesElement = { ...element };
        const aktualisiertesElement = elementLaengeAnpassen(element, neueLaenge);
        setAktionen([...aktionen, { typ: 'aktualisieren', element: aktualisiertesElement, altesElement }]);
        setWiederherstellungsAktionen([]);
        return aktualisiertesElement;
      }
      return element;
    });
    setElemente(konsistenzPruefen(aktualisiertesElement));
  };

  const elementWinkelAktualisieren = (id: string, neuerWinkel: number) => {
    const aktualisiertesElement = elemente.map(element => {
      if (element.id === id) {
        const altesElement = { ...element };
        const winkel = neuerWinkel * Math.PI / 180;
        const laenge = element.laenge! * PIXEL_PRO_METER;
        const neuesEndeX = element.start.x + Math.cos(winkel) * laenge;
        const neuesEndeY = element.start.y + Math.sin(winkel) * laenge;
        const aktualisiertesElement = {
          ...element,
          ende: { x: neuesEndeX, y: neuesEndeY },
          winkel: neuerWinkel
        };
        setAktionen([...aktionen, { typ: 'aktualisieren', element: aktualisiertesElement, altesElement }]);
        setWiederherstellungsAktionen([]);
        return aktualisiertesElement;
      }
      return element;
    });
    setElemente(konsistenzPruefen(aktualisiertesElement));
  };

  const elementDrehen = (id: string) => {
    const aktualisiertesElement = elemente.map(element => {
      if (element.id === id) {
        const altesElement = { ...element };
        const neuerWinkel = (element.winkel! + 90) % 360;
        const aktualisiertesElement = {
          ...element,
          winkel: neuerWinkel,
          ende: punktDrehen(element.start, element.ende, 90)
        };
        setAktionen([...aktionen, { typ: 'aktualisieren', element: aktualisiertesElement, altesElement }]);
        setWiederherstellungsAktionen([]);
        return aktualisiertesElement;
      }
      return element;
    });
    setElemente(konsistenzPruefen(aktualisiertesElement));
  };

  const elementLoeschen = (id: string) => {
    const geloeschtesElement = elemente.find(element => element.id === id);
    if (geloeschtesElement) {
      const aktualisiertesElement = elemente.filter(element => element.id !== id);
      setElemente(aktualisiertesElement);
      setAktionen([...aktionen, { typ: 'loeschen', element: geloeschtesElement }]);
      setWiederherstellungsAktionen([]);
      const neueVerwendeteBezeichnungen = new Set(verwendeteBezeichnungen);
      neueVerwendeteBezeichnungen.delete(geloeschtesElement.bezeichnung);
      setVerwendeteBezeichnungen(neueVerwendeteBezeichnungen);
      naechsteBezeichnungAktualisieren();
    }
  };

  const rueckgaengig = () => {
    if (aktionen.length > 0) {
      const letzteAktion = aktionen[aktionen.length - 1];
      const neueElemente = [...elemente];

      switch (letzteAktion.typ) {
        case 'hinzufuegen':
          neueElemente.pop();
          const neueVerwendeteBezeichnungen = new Set(verwendeteBezeichnungen);
          neueVerwendeteBezeichnungen.delete(letzteAktion.element.bezeichnung);
          setVerwendeteBezeichnungen(neueVerwendeteBezeichnungen);
          break;
        case 'loeschen':
          neueElemente.push(letzteAktion.element);
          setVerwendeteBezeichnungen(new Set(verwendeteBezeichnungen).add(letzteAktion.element.bezeichnung));
          break;
        case 'aktualisieren':
        case 'verschieben':
          if (letzteAktion.altesElement) {
            const index = neueElemente.findIndex(element => element.id === letzteAktion.element.id);
            if (index !== -1) {
              neueElemente[index] = letzteAktion.altesElement;
            }
          }
          break;
      }

      setElemente(konsistenzPruefen(neueElemente));
      setAktionen(aktionen.slice(0, -1));
      setWiederherstellungsAktionen([letzteAktion, ...wiederherstellungsAktionen]);
      naechsteBezeichnungAktualisieren();
    }
  };

  const wiederherstellen = () => {
    if (wiederherstellungsAktionen.length > 0) {
      const naechsteAktion = wiederherstellungsAktionen[0];
      const neueElemente = [...elemente];

      switch (naechsteAktion.typ) {
        case 'hinzufuegen':
          neueElemente.push(naechsteAktion.element);
          setVerwendeteBezeichnungen(new Set(verwendeteBezeichnungen).add(naechsteAktion.element.bezeichnung));
          break;
        case 'loeschen':
          const index = neueElemente.findIndex(element => element.id === naechsteAktion.element.id);
          if (index !== -1) {
            neueElemente.splice(index, 1);
          }
          const neueVerwendeteBezeichnungen = new Set(verwendeteBezeichnungen);
          neueVerwendeteBezeichnungen.delete(naechsteAktion.element.bezeichnung);
          setVerwendeteBezeichnungen(neueVerwendeteBezeichnungen);
          break;
        case 'aktualisieren':
        case 'verschieben':
          const updateIndex = neueElemente.findIndex(element => element.id === naechsteAktion.element.id);
          if (updateIndex !== -1) {
            neueElemente[updateIndex] = naechsteAktion.element;
          }
          break;
      }

      setElemente(konsistenzPruefen(neueElemente));
      setAktionen([...aktionen, naechsteAktion]);
      setWiederherstellungsAktionen(wiederherstellungsAktionen.slice(1));
      naechsteBezeichnungAktualisieren();
    }
  };

  const ziehenStarten = (id: string, x: number, y: number) => {
    setGezogenesElementId(id);
    setZugStart({ x, y });
    setHervorgehobeneBezeichnung(elemente.find(element => element.id === id)?.bezeichnung || null);
  };

  const ziehen = (x: number, y: number) => {
    if (gezogenesElementId !== null && zugStart) {
      const dx = x - zugStart.x;
      const dy = y - zugStart.y;
      const aktualisiertesElement = elemente.map(element => {
        if (element.id === gezogenesElementId) {
          const altesElement = { ...element };
          const aktualisiertesElement = {
            ...element,
            start: { x: element.start.x + dx, y: element.start.y + dy },
            ende: { x: element.ende.x + dx, y: element.ende.y + dy }
          };
          setAktionen([...aktionen, { typ: 'verschieben', element: aktualisiertesElement, altesElement }]);
          setWiederherstellungsAktionen([]);
          return aktualisiertesElement;
        }
        return element;
      });
      setElemente(konsistenzPruefen(aktualisiertesElement));
      setZugStart({ x, y });
    }
  };

  const ziehenBeenden = () => {
    setGezogenesElementId(null);
    setZugStart(null);
    setHervorgehobeneBezeichnung(null);
  };

  const winkelBerechnen = (start: Punkt, ende: Punkt): number => {
    const dx = ende.x - start.x;
    const dy = ende.y - start.y;
    let winkel = Math.atan2(dy, dx) * (180 / Math.PI);
    if (winkel < 0) winkel += 360;
    return Number(winkel.toFixed(genauigkeit.winkelPraezision));
  };

  const elementLaengeAnpassen = (element: Element, gewuenschteLaenge: number) => {
    const aktuelleLaenge = abstand(element.start, element.ende);
    const skalierung = gewuenschteLaenge * PIXEL_PRO_METER / aktuelleLaenge;
    const dx = element.ende.x - element.start.x;
    const dy = element.ende.y - element.start.y;
    return {
      ...element,
      ende: {
        x: element.start.x + dx * skalierung,
        y: element.start.y + dy * skalierung
      },
      laenge: gewuenschteLaenge
    };
  };

  const konsistenzPruefen = (elemente: Element[]) => {
    return elemente.map(element => {
      if (element.typ !== 'text') {
        const berechnetelaenge = Math.round(abstand(element.start, element.ende) / PIXEL_PRO_METER);
        const istKonsistent = berechnetelaenge === element.laenge;
        return { ...element, istKonsistent, laenge: berechnetelaenge };
      }
      return element;
    });
  };

  const punktDrehen = (zentrum: Punkt, punkt: Punkt, winkel: number) => {
    const radians = (Math.PI / 180) * winkel,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (punkt.x - zentrum.x)) + (sin * (punkt.y - zentrum.y)) + zentrum.x,
        ny = (cos * (punkt.y - zentrum.y)) - (sin * (punkt.x - zentrum.x)) + zentrum.y;
    return { x: nx, y: ny };
  };

  const vergroessern = () => {
    setSkalierung(vorherigeSkalierung => Math.min(vorherigeSkalierung * 1.1, 5));
  };

  const verkleinern = () => {
    setSkalierung(vorherigeSkalierung => Math.max(vorherigeSkalierung / 1.1, 0.5));
  };

  return {
    elemente,
    setElemente,
    aktuellesElement,
    zeichnenStarten,
    zeichnen,
    zeichnenBeenden,
    elementLaengeAktualisieren,
    elementWinkelAktualisieren,
    elementDrehen,
    elementLoeschen,
    rueckgaengig,
    wiederherstellen,
    ziehenStarten,
    ziehen,
    ziehenBeenden,
    hervorgehobeneBezeichnung,
    genauigkeit,
    setGenauigkeit,
    skalierung,
    vergroessern,
    verkleinern,
    aktuellesWerkzeug,
    setAktuellesWerkzeug
  };
};

const linieZeichnen = (ctx: CanvasRenderingContext2D, start: Punkt, ende: Punkt, dicke: number) => {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(ende.x, ende.y);
  ctx.lineWidth = dicke;
  ctx.lineCap = 'round';
  ctx.stroke();
};

const hilfslinienZeichnen = (ctx: CanvasRenderingContext2D, aktuellerPunkt: Punkt, elemente: Element[]) => {
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)';
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1;

  elemente.forEach(element => {
    if (Math.abs(element.start.x - aktuellerPunkt.x) < EINRAST_SCHWELLE) {
      ctx.beginPath();
      ctx.moveTo(element.start.x, 0);
      ctx.lineTo(element.start.x, ctx.canvas.height);
      ctx.stroke();
    }
    if (Math.abs(element.start.y - aktuellerPunkt.y) < EINRAST_SCHWELLE) {
      ctx.beginPath();
      ctx.moveTo(0, element.start.y);
      ctx.lineTo(ctx.canvas.width, element.start.y);
      ctx.stroke();
    }
  });

  ctx.restore();
};

export default function GrundrissZeichner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    elemente,
    setElemente,
    aktuellesElement,
    zeichnenStarten,
    zeichnen,
    zeichnenBeenden,
    elementLaengeAktualisieren,
    elementWinkelAktualisieren,
    elementDrehen,
    elementLoeschen,
    rueckgaengig,
    wiederherstellen,
    ziehenStarten,
    ziehen,
    ziehenBeenden,
    hervorgehobeneBezeichnung,
    genauigkeit,
    setGenauigkeit,
    skalierung,
    vergroessern,
    verkleinern,
    aktuellesWerkzeug,
    setAktuellesWerkzeug
  } = useGrundrissZeichner();
  const [grundrisse, setGrundrisse] = useState<Grundriss[]>([]);
  const [aktuellerGrundriss, setAktuellerGrundriss] = useState<Grundriss | null>(null);

  const canvasZeichnen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.clientWidth * CANVAS_SKALIERUNG;
    canvas.height = canvas.clientHeight * CANVAS_SKALIERUNG;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(skalierung * CANVAS_SKALIERUNG, skalierung * CANVAS_SKALIERUNG);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    elemente.forEach((element) => {
      ctx.beginPath();
      ctx.moveTo(element.start.x, element.start.y);
      ctx.lineTo(element.ende.x, element.ende.y);

      switch (element.typ) {
        case 'linie':
          ctx.lineWidth = LINIEN_DICKE / skalierung;
          ctx.strokeStyle = element.istKonsistent ? 'black' : 'red';
          break;
        case 'tuer':
          ctx.lineWidth = TUER_DICKE / skalierung;
          ctx.strokeStyle = 'brown';
          break;
        case 'fenster':
          ctx.lineWidth = FENSTER_DICKE / skalierung;
          ctx.strokeStyle = 'gray';
          break;
        case 'text':
          ctx.font = `${14 / skalierung}px Arial`;
          ctx.fillStyle = 'black';
          ctx.fillText(element.text || '', element.start.x, element.start.y);
          break;
      }

      if (element.typ !== 'text') {
        ctx.stroke();
      }

      if (element.typ !== 'text') {
        const mitteX = (element.start.x + element.ende.x) / 2;
        const mitteY = (element.start.y + element.ende.y) / 2;
        ctx.beginPath();
        ctx.arc(mitteX, mitteY, BEZEICHNUNGS_RADIUS / skalierung, 0, 2 * Math.PI);
        ctx.fillStyle = element.bezeichnung === hervorgehobeneBezeichnung ? 'yellow' : 'white';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${12 / skalierung}px Arial`;
        ctx.fillText(element.bezeichnung, mitteX, mitteY);
      }
    });

    if (aktuellesElement) {
      linieZeichnen(ctx, aktuellesElement.start, aktuellesElement.ende, LINIEN_DICKE / skalierung);
      hilfslinienZeichnen(ctx, aktuellesElement.ende, elemente);
    }

    ctx.restore();
  }, [elemente, aktuellesElement, hervorgehobeneBezeichnung, skalierung]);

  useEffect(() => {
    canvasZeichnen();
  }, [canvasZeichnen]);

  const handleCanvasMausRunter = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / skalierung;
    const y = (e.clientY - rect.top) / skalierung;

    const angeklicktesElement = elemente.find(element => {
      if (element.typ === 'text') {
        const dx = x - element.start.x;
        const dy = y - element.start.y;
        return (dx * dx + dy * dy) <= ((BEZEICHNUNGS_RADIUS / skalierung) * (BEZEICHNUNGS_RADIUS / skalierung));
      } else {
        const mitteX = (element.start.x + element.ende.x) / 2;
        const mitteY = (element.start.y + element.ende.y) / 2;
        const dx = x - mitteX;
        const dy = y - mitteY;
        return (dx * dx + dy * dy) <= ((BEZEICHNUNGS_RADIUS / skalierung) * (BEZEICHNUNGS_RADIUS / skalierung));
      }
    });

    if (angeklicktesElement) {
      ziehenStarten(angeklicktesElement.id, x, y);
    } else {
      zeichnenStarten(x, y);
    }
  };

  const handleCanvasMausBewegung = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / skalierung;
    const y = (e.clientY - rect.top) / skalierung;

    if (e.buttons === 1) {
      ziehen(x, y);
    }
    zeichnen(x, y);
  };

  const handleCanvasMausHoch = () => {
    zeichnenBeenden();
    ziehenBeenden();
  };

  const handleSpeichern = () => {
    if (aktuellerGrundriss) {
      const aktualisiertesGrundriss = grundrisse.map(gp =>
        gp.id === aktuellerGrundriss.id ? { ...gp, elemente } : gp
      );
      setGrundrisse(aktualisiertesGrundriss);
    } else {
      const neuerGrundriss: Grundriss = {
        id: Date.now().toString(),
        name: `Grundriss ${grundrisse.length + 1}`,
        elemente,
      };
      setGrundrisse([...grundrisse, neuerGrundriss]);
      setAktuellerGrundriss(neuerGrundriss);
    }
  };

  const handleNeuerGrundriss = () => {
    setElemente([]);
    setAktuellerGrundriss(null);
  };

  const handleExportieren = (format: 'jpg' | 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    if (format === 'jpg') {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    ctx.scale(skalierung * CANVAS_SKALIERUNG, skalierung * CANVAS_SKALIERUNG);

    elemente.forEach((element) => {
      ctx.beginPath();
      ctx.moveTo(element.start.x, element.start.y);
      ctx.lineTo(element.ende.x, element.ende.y);

      switch (element.typ) {
        case 'linie':
          ctx.lineWidth = LINIEN_DICKE / skalierung;
          ctx.strokeStyle = 'black';
          break;
        case 'tuer':
          ctx.lineWidth = TUER_DICKE / skalierung;
          ctx.strokeStyle = 'brown';
          break;
        case 'fenster':
          ctx.lineWidth = FENSTER_DICKE / skalierung;
          ctx.strokeStyle = 'gray';
          break;
        case 'text':
          ctx.font = `${14 / skalierung}px Arial`;
          ctx.fillStyle = 'black';
          ctx.fillText(element.text || '', element.start.x, element.start.y);
          break;
      }

      if (element.typ !== 'text') {
        ctx.stroke();
      }
    });

    const dataUrl = exportCanvas.toDataURL(`image/${format}`, 1.0);
    const link = document.createElement('a');
    link.download = `${aktuellerGrundriss?.name || 'grundriss'}.${format}`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Grundriss-Designer</h2>
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="space-x-2">
              <Button onClick={handleNeuerGrundriss} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Neuer Plan
              </Button>
              <Button onClick={handleSpeichern} variant="outline">
                <Save className="mr-2 h-4 w-4" /> Speichern
              </Button>
              <Button onClick={() => handleExportieren('jpg')} variant="outline">
                <Download className="mr-2 h-4 w-4" /> Als JPG exportieren
              </Button>
              <Button onClick={() => handleExportieren('png')} variant="outline">
                <Download className="mr-2 h-4 w-4" /> Als PNG exportieren
              </Button>
            </div>
            <div className="space-x-2">
              <Button onClick={rueckgaengig} variant="ghost" size="icon">
                <Undo className="h-4 w-4" />
              </Button>
              <Button onClick={wiederherstellen} variant="ghost" size="icon">
                <Redo className="h-4 w-4" />
              </Button>
              <Button onClick={verkleinern} variant="ghost" size="icon">
                <Minus className="h-4 w-4" />
              </Button>
              <Button onClick={vergroessern} variant="ghost" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex space-x-4 mb-4">
            <Button 
              onClick={() => setAktuellesWerkzeug('linie')} 
              variant={aktuellesWerkzeug === 'linie' ? 'default' : 'outline'}
              className={aktuellesWerkzeug === 'linie' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
            >
              Linie
            </Button>
            <Button 
              onClick={() => setAktuellesWerkzeug('tuer')} 
              variant={aktuellesWerkzeug === 'tuer' ? 'default' : 'outline'}
              className={aktuellesWerkzeug === 'tuer' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
            >
              <DoorOpen className="mr-2 h-4 w-4" /> Tür
            </Button>
            <Button 
              onClick={() => setAktuellesWerkzeug('fenster')} 
              variant={aktuellesWerkzeug === 'fenster' ? 'default' : 'outline'}
              className={aktuellesWerkzeug === 'fenster' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
            >
              <Square className="mr-2 h-4 w-4" /> Fenster
            </Button>
            <Button 
              onClick={() => setAktuellesWerkzeug('text')} 
              variant={aktuellesWerkzeug === 'text' ? 'default' : 'outline'}
              className={aktuellesWerkzeug === 'text' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
            >
              <Type className="mr-2 h-4 w-4" /> Text
            </Button>
          </div>
          <div className="flex space-x-6">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="border border-gray-200 rounded-lg shadow-inner bg-white"
                style={{ width: '800px', height: '600px' }}
                onMouseDown={handleCanvasMausRunter}
                onMouseMove={handleCanvasMausBewegung}
                onMouseUp={handleCanvasMausHoch}
              />
              <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded text-sm text-gray-500">
                Maßstab: {skalierung.toFixed(2)}x
              </div>
            </div>
            <div className="w-80">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Elementeigenschaften</h3>
              <ScrollArea className="h-[560px] pr-4">
                <div className="space-y-4">
                  {elemente.map((element) => (
                    <div key={element.id} className="bg-white p-3 rounded-lg shadow">
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor={`element-${element.id}`} className="font-medium">{element.bezeichnung}:</Label>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => elementLoeschen(element.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {element.typ !== 'text' ? (
                        <>
                          <div className="flex items-center space-x-2 mb-2">
                            <Input
                              id={`element-${element.id}`}
                              type="number"
                              value={element.laenge}
                              onChange={(e) => elementLaengeAktualisieren(element.id, parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                            <span className="text-gray-500">m</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={element.winkel}
                              onChange={(e) => elementWinkelAktualisieren(element.id, parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                            <span className="text-gray-500">°</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => elementDrehen(element.id)}
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Input
                          value={element.text || ''}
                          onChange={(e) => {
                            const aktualisiertesElement = elemente.map(el => 
                              el.id === element.id ? { ...el, text: e.target.value } : el
                            );
                            setElemente(aktualisiertesElement);
                          }}
                          className="w-full"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}