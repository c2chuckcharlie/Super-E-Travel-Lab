/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  FileText, 
  Brain, 
  Map, 
  Layers, 
  CheckCircle2, 
  BarChart3, 
  Presentation,
  Mic,
  Link as LinkIcon,
  Loader2,
  Sparkles,
  Search,
  MessageSquare
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Markdown from 'react-markdown';
import { cn } from '@/src/lib/utils';
import { ProjectState, STEPS, StepId, UserStory, HiddenNeed, JourneyPoint, MoSCoWItem, Language } from './types';
import * as gemini from './services/gemini';
import { translations } from './translations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function App() {
  const [state, setState] = useState<ProjectState>({
    currentStep: 0,
    itinerary: '',
    userStories: [],
    hiddenNeeds: [],
    journeyMap: [],
    moscow: [],
    blueprint: '',
    finalDocument: '',
    differentiation: '',
    pitch: '',
  });

  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [lang, setLang] = useState<Language>('en');

  const t = translations[lang];

  const nextStep = () => {
    if (state.currentStep < 6) {
      setState(prev => ({ ...prev, currentStep: (prev.currentStep + 1) as StepId }));
    }
  };

  const prevStep = () => {
    if (state.currentStep > 0) {
      setState(prev => ({ ...prev, currentStep: (prev.currentStep - 1) as StepId }));
    }
  };

  const handleItinerarySubmit = async (content: string) => {
    setLoading(true);
    try {
      const stories = await gemini.analyzeItinerary(content, lang);
      setState(prev => ({ 
        ...prev, 
        itinerary: content, 
        userStories: stories, 
        currentStep: 1 
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleHiddenNeeds = async () => {
    setLoading(true);
    try {
      const needs = await gemini.suggestHiddenNeeds(state.itinerary, state.userStories, lang);
      setState(prev => ({ ...prev, hiddenNeeds: needs, currentStep: 2 }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleJourneyMap = async () => {
    setLoading(true);
    try {
      const map = await gemini.generateJourneyMap(state, lang);
      setState(prev => ({ ...prev, journeyMap: map, currentStep: 3 }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoSCoW = async () => {
    setLoading(true);
    try {
      const moscow = await gemini.generateMoSCoW(state, lang);
      setState(prev => ({ ...prev, moscow, currentStep: 4 }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlueprint = async () => {
    setLoading(true);
    try {
      const blueprint = await gemini.generateBlueprint(state, lang);
      setState(prev => ({ ...prev, blueprint, currentStep: 5 }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePitch = async () => {
    setLoading(true);
    try {
      const pitch = await gemini.generatePitch(state, lang);
      setState(prev => ({ ...prev, pitch, currentStep: 6 }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const triggerCascade = async (fromStep: StepId) => {
    setLoading(true);
    let currentState = { ...state };
    
    try {
      if (fromStep <= 0) {
        const stories = await gemini.analyzeItinerary(currentState.itinerary, lang);
        currentState = { ...currentState, userStories: stories };
        setState(prev => ({ ...prev, userStories: stories }));
      }
      if (fromStep <= 1) {
        const needs = await gemini.suggestHiddenNeeds(currentState.itinerary, currentState.userStories, lang);
        currentState = { ...currentState, hiddenNeeds: needs };
        setState(prev => ({ ...prev, hiddenNeeds: needs }));
      }
      if (fromStep <= 2) {
        const map = await gemini.generateJourneyMap(currentState, lang);
        currentState = { ...currentState, journeyMap: map };
        setState(prev => ({ ...prev, journeyMap: map }));
      }
      if (fromStep <= 3) {
        const moscow = await gemini.generateMoSCoW(currentState, lang);
        currentState = { ...currentState, moscow };
        setState(prev => ({ ...prev, moscow }));
      }
      if (fromStep <= 4) {
        const blueprint = await gemini.generateBlueprint(currentState, lang);
        currentState = { ...currentState, blueprint };
        setState(prev => ({ ...prev, blueprint }));
      }
      if (fromStep <= 5) {
        const pitch = await gemini.generatePitch(currentState, lang);
        currentState = { ...currentState, pitch };
        setState(prev => ({ ...prev, pitch }));
      }
    } catch (error) {
      console.error("Cascade error:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    setLoading(true);
    const element = document.createElement('div');
    element.style.padding = '60px';
    element.style.width = '900px';
    element.style.background = 'white';
    element.style.color = 'black';
    element.style.fontFamily = 'sans-serif';
    element.style.lineHeight = '1.6';
    
    element.innerHTML = `
      <div style="border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 40px;">
        <h1 style="font-size: 32px; margin: 0; font-weight: 800; letter-spacing: -0.02em;">${t.appName}</h1>
        <p style="font-size: 14px; color: #666; margin: 10px 0 0 0;">Strategic Reconstruction Report • ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 20px; border-left: 4px solid #10b981; padding-left: 15px; margin-bottom: 15px;">1. ${t.steps[0].title}</h2>
        <div style="font-size: 14px; color: #333; background: #f9f9f9; padding: 20px; rounded: 12px;">${state.itinerary.replace(/\n/g, '<br>')}</div>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 20px; border-left: 4px solid #10b981; padding-left: 15px; margin-bottom: 15px;">2. ${t.steps[1].title}</h2>
        <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
          ${state.userStories.map(s => `
            <div style="padding: 15px; border: 1px solid #eee; border-radius: 8px;">
              <span style="color: #666; font-size: 12px;">As a</span> <b style="color: #059669;">${s.role}</b>, 
              <span style="color: #666; font-size: 12px;">I want to</span> <b style="color: #4f46e5;">${s.action}</b> 
              <span style="color: #666; font-size: 12px;">so that</span> <b>${s.value}</b>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 20px; border-left: 4px solid #10b981; padding-left: 15px; margin-bottom: 15px;">3. ${t.steps[2].title}</h2>
        <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
          ${state.hiddenNeeds.map(n => `
            <div style="padding: 15px; border: 1px solid #eee; border-radius: 8px;">
              <b style="color: #059669; font-size: 12px; text-transform: uppercase;">${n.category}</b><br>
              <span style="font-size: 14px;">${n.description}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 20px; border-left: 4px solid #10b981; padding-left: 15px; margin-bottom: 15px;">4. ${t.steps[3].title}</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f3f4f6; text-align: left;">
              <th style="padding: 10px; border: 1px solid #ddd;">Phase</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Title</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Description</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Emotion</th>
            </tr>
          </thead>
          <tbody>
            ${state.journeyMap.map(p => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${p.phase}</td>
                <td style="padding: 10px; border: 1px solid #ddd;"><b>${p.title}</b></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${p.description}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${p.emotion}/10</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 20px; border-left: 4px solid #10b981; padding-left: 15px; margin-bottom: 15px;">5. ${t.steps[4].title}</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          ${['Must', 'Should', 'Could', "Won't"].map(cat => `
            <div style="padding: 15px; border: 1px solid #eee; border-radius: 12px;">
              <b style="font-size: 12px; text-transform: uppercase; color: #666;">${cat}</b>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 13px;">
                ${state.moscow.filter(m => m.category === cat).map(m => `<li>${m.content}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 20px; border-left: 4px solid #10b981; padding-left: 15px; margin-bottom: 15px;">6. ${t.steps[5].title}</h2>
        <div style="font-size: 14px; color: #333; background: #fff; border: 1px solid #eee; padding: 25px; border-radius: 16px; font-family: monospace;">
          ${state.blueprint.replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <div style="margin-bottom: 40px; page-break-before: always;">
        <h2 style="font-size: 24px; text-align: center; margin-bottom: 30px; font-weight: 700;">7. ${t.steps[6].title}</h2>
        <div style="font-size: 18px; color: #000; line-height: 1.8; background: #fff; border: 2px solid #000; padding: 40px; border-radius: 24px; text-align: center; font-style: italic;">
          "${state.pitch.replace(/\n/g, '<br>')}"
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 60px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px;">
        © ${new Date().getFullYear()} ${t.appName} • Strategic Reconstruction Framework
      </div>
    `;
    
    document.body.appendChild(element);
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`EMBA_Strategy_Report_${lang}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      document.body.removeChild(element);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f4] text-[#0a0a0a] font-sans selection:bg-emerald-100">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-black/5 p-6 z-20 hidden lg:block">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">E</div>
          <h1 className="font-semibold tracking-tight">{t.appName}</h1>
        </div>
        
        <nav className="space-y-1">
          {t.steps.map((step, index) => (
            <button
              key={index}
              onClick={() => setState(prev => ({ ...prev, currentStep: index as StepId }))}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-3",
                state.currentStep === index 
                  ? "bg-black text-white shadow-md" 
                  : "text-neutral-500 hover:bg-neutral-100"
              )}
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-full border border-current text-[10px] font-bold">
                {index}
              </span>
              {step.title}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6 space-y-4">
          <div className="flex gap-2 p-1 bg-neutral-100 rounded-lg">
            <button 
              onClick={() => setLang('en')}
              className={cn(
                "flex-1 py-1 text-[10px] font-bold rounded-md transition-all",
                lang === 'en' ? "bg-white shadow-sm text-black" : "text-neutral-400"
              )}
            >
              EN
            </button>
            <button 
              onClick={() => setLang('zh')}
              className={cn(
                "flex-1 py-1 text-[10px] font-bold rounded-md transition-all",
                lang === 'zh' ? "bg-white shadow-sm text-black" : "text-neutral-400"
              )}
            >
              中文
            </button>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 mb-1">{t.status}</p>
            <p className="text-xs text-emerald-900 font-medium">{t.inProgress}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 md:p-8 lg:p-12 max-w-5xl mx-auto min-h-screen flex flex-col">
        <header className="mb-12 flex justify-between items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">
              {t.phase} {Math.floor(state.currentStep / 3) + 1} • {t.step} {state.currentStep}
            </p>
            <h2 className="text-4xl font-semibold tracking-tight mb-4">
              {t.steps[state.currentStep]?.title}
            </h2>
            <p className="text-neutral-500 max-w-xl">
              {t.steps[state.currentStep]?.description}
            </p>
          </div>
          
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 p-1 bg-white border border-black/5 rounded-xl shadow-sm mr-2">
              <button 
                onClick={() => setLang('en')}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded-lg transition-all",
                  lang === 'en' ? "bg-black text-white" : "text-neutral-400 hover:text-neutral-600"
                )}
              >
                EN
              </button>
              <button 
                onClick={() => setLang('zh')}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded-lg transition-all",
                  lang === 'zh' ? "bg-black text-white" : "text-neutral-400 hover:text-neutral-600"
                )}
              >
                中文
              </button>
            </div>
            <button 
              onClick={() => setChatOpen(true)}
              className="p-3 bg-white rounded-full border border-black/5 shadow-sm hover:shadow-md transition-all text-neutral-600"
            >
              <MessageSquare size={20} />
            </button>
          </div>
        </header>

        <div className="flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {state.currentStep === 0 && (
                <ItineraryInput 
                  onSubmit={handleItinerarySubmit} 
                  loading={loading} 
                  lang={lang} 
                  initialValue={state.itinerary} 
                  onUpdate={(content) => {
                    setState(prev => ({ ...prev, itinerary: content }));
                    triggerCascade(0);
                  }}
                />
              )}

              {state.currentStep === 1 && (
                <UserStoriesView 
                  stories={state.userStories} 
                  onNext={handleHiddenNeeds} 
                  loading={loading} 
                  lang={lang} 
                  onUpdate={(stories) => {
                    setState(prev => ({ ...prev, userStories: stories }));
                    triggerCascade(1);
                  }}
                />
              )}

              {state.currentStep === 2 && (
                <HiddenNeedsView 
                  needs={state.hiddenNeeds} 
                  onNext={handleJourneyMap} 
                  loading={loading} 
                  lang={lang} 
                  onUpdate={(needs) => {
                    setState(prev => ({ ...prev, hiddenNeeds: needs }));
                    triggerCascade(2);
                  }}
                />
              )}

              {state.currentStep === 3 && (
                <JourneyMapView 
                  map={state.journeyMap} 
                  onNext={handleMoSCoW} 
                  loading={loading} 
                  lang={lang} 
                  onUpdate={(map) => {
                    setState(prev => ({ ...prev, journeyMap: map }));
                    triggerCascade(3);
                  }}
                />
              )}

              {state.currentStep === 4 && (
                <MoSCoWView 
                  items={state.moscow} 
                  onNext={handleBlueprint} 
                  loading={loading} 
                  lang={lang} 
                  onUpdate={(items) => {
                    setState(prev => ({ ...prev, moscow: items }));
                    triggerCascade(4);
                  }}
                />
              )}

              {state.currentStep === 5 && (
                <BlueprintView 
                  blueprint={state.blueprint} 
                  onNext={handlePitch} 
                  loading={loading} 
                  lang={lang} 
                  onUpdate={(blueprint) => {
                    setState(prev => ({ ...prev, blueprint }));
                    triggerCascade(5);
                  }}
                />
              )}

              {state.currentStep === 6 && (
                <PitchView 
                  pitch={state.pitch} 
                  lang={lang} 
                  onDownload={exportToPDF}
                  onUpdate={(pitch) => {
                    setState(prev => ({ ...prev, pitch }));
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="mt-12 pt-8 border-t border-black/5 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={state.currentStep === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-neutral-500 hover:text-black disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={20} />
            {t.previous}
          </button>
          
          <div className="flex gap-4">
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-xl font-medium hover:bg-neutral-800 transition-all shadow-lg shadow-black/10"
            >
              {t.next}
              <ChevronRight size={20} />
            </button>
          </div>
        </footer>
      </main>

      {/* Chat Bot Overlay */}
      <ChatBot isOpen={chatOpen} onClose={() => setChatOpen(false)} lang={lang} />
    </div>
  );
}

function ItineraryInput({ onSubmit, loading: parentLoading, lang, initialValue, onUpdate }: { onSubmit: (c: string) => void, loading: boolean, lang: Language, initialValue?: string, onUpdate?: (c: string) => void }) {
  const [content, setContent] = useState(initialValue || '');
  const [loading, setLoading] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    if (initialValue) setContent(initialValue);
  }, [initialValue]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setLoading(true);
    let combinedText = '';
    
    for (const file of acceptedFiles) {
      try {
        if (file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item: any) => item.str).join(' ');
          }
          combinedText += `\n[PDF: ${file.name}]\n${text}`;
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          combinedText += `\n[Word: ${file.name}]\n${result.value}`;
        } else if (file.type.startsWith('image/')) {
          // In a real app, we'd use Gemini Vision here
          combinedText += `\n[Image: ${file.name}] (Image uploaded for analysis)`;
        } else {
          const text = await file.text();
          combinedText += `\n[File: ${file.name}]\n${text}`;
        }
      } catch (err) {
        console.error(`Error parsing ${file.name}:`, err);
      }
    }
    
    setContent(prev => prev + combinedText);
    setLoading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="space-y-8">
      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer",
          isDragActive ? "border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"
        )}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-neutral-400">
          <Upload size={32} />
        </div>
        <h3 className="text-xl font-medium mb-2">{t.dropItinerary}</h3>
        <div className="flex gap-4 mt-4">
          <button className="flex-1 p-4 bg-white border border-black/5 rounded-2xl flex items-center justify-center gap-2 text-neutral-500 hover:text-black transition-all">
            <Mic size={20} />
            {t.recordAudio}
          </button>
          <button className="flex-1 p-4 bg-white border border-black/5 rounded-2xl flex items-center justify-center gap-2 text-neutral-500 hover:text-black transition-all">
            <LinkIcon size={20} />
            {t.youtubeLink}
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t.pastePlaceholder}
          className="w-full h-64 p-6 rounded-3xl bg-white border border-black/5 shadow-sm focus:ring-2 focus:ring-black/5 focus:outline-none resize-none transition-all"
        />
        <button
          onClick={() => onSubmit(content)}
          disabled={!content || parentLoading || loading}
          className="absolute bottom-4 right-4 px-6 py-2 bg-black text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
        >
          {parentLoading || loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
          {t.analyze}
        </button>
      </div>

      {initialValue && onUpdate && (
        <button 
          onClick={() => onUpdate(content)}
          disabled={parentLoading || loading}
          className="w-full py-3 bg-neutral-100 text-neutral-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all"
        >
          {t.updateAndRegenerate}
        </button>
      )}
    </div>
  );
}

function MoSCoWView({ items, onNext, loading, lang, onUpdate }: { items: MoSCoWItem[], onNext: () => void, loading: boolean, lang: Language, onUpdate: (items: MoSCoWItem[]) => void }) {
  const t = translations[lang];
  const [localItems, setLocalItems] = useState(items);
  const categories = [
    { key: 'Must', label: t.must },
    { key: 'Should', label: t.should },
    { key: 'Could', label: t.could },
    { key: "Won't", label: t.wont }
  ];

  const handleChange = (idx: number, content: string) => {
    const newItems = [...localItems];
    newItems[idx] = { ...newItems[idx], content };
    setLocalItems(newItems);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map(cat => (
          <div key={cat.key} className="p-6 bg-white rounded-[2rem] border border-black/5 shadow-sm">
            <h4 className={cn(
              "text-xs font-bold uppercase tracking-widest mb-4 px-2",
              cat.key === 'Must' ? "text-red-500" : 
              cat.key === 'Should' ? "text-orange-500" :
              cat.key === 'Could' ? "text-yellow-600" : "text-neutral-400"
            )}>{cat.label} {t.have}</h4>
            <div className="space-y-2">
              {localItems.map((item, idx) => item.category === cat.key ? (
                <textarea
                  key={idx}
                  value={item.content}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  className="w-full p-3 bg-neutral-50 rounded-xl text-sm border border-black/5 focus:ring-1 focus:ring-black/10 focus:outline-none resize-none"
                  rows={2}
                />
              ) : null)}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-4">
        <button 
          onClick={() => onUpdate(localItems)}
          className="text-xs font-bold text-neutral-400 hover:text-black transition-all uppercase tracking-widest"
        >
          {t.updateAndRegenerate}
        </button>
        <button onClick={onNext} disabled={loading} className="px-8 py-3 bg-black text-white rounded-xl font-medium flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Layers size={18} />}
          {t.generateBlueprint}
        </button>
      </div>
    </div>
  );
}

function BlueprintView({ blueprint, onNext, loading, lang, onUpdate }: { blueprint: string, onNext: () => void, loading: boolean, lang: Language, onUpdate: (b: string) => void }) {
  const t = translations[lang];
  const [localBlueprint, setLocalBlueprint] = useState(blueprint);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  const handleGenerateImage = async () => {
    setGeneratingImage(true);
    try {
      const url = await gemini.generateImage(`A high-end, strategic visualization of an EMBA journey in Eastern Europe, showing social, cultural, and academic layers. Professional, architectural style.`);
      setImageUrl(url);
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 bg-white rounded-[2rem] border border-black/5 shadow-sm h-[600px] flex flex-col">
          <textarea
            value={localBlueprint}
            onChange={(e) => setLocalBlueprint(e.target.value)}
            className="flex-grow w-full p-4 bg-transparent border-none focus:ring-0 focus:outline-none resize-none font-mono text-sm"
          />
          <button 
            onClick={() => onUpdate(localBlueprint)}
            className="mt-4 py-2 text-xs font-bold text-neutral-400 hover:text-black transition-all uppercase tracking-widest border-t border-black/5"
          >
            {t.updateAndRegenerate}
          </button>
        </div>
        <div className="space-y-4">
          <div className="aspect-video bg-neutral-100 rounded-[2rem] border border-black/5 overflow-hidden flex items-center justify-center relative group">
            {imageUrl ? (
              <img src={imageUrl} alt={t.generateVisual} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Sparkles className="text-neutral-400" size={32} />
                </div>
                <p className="text-sm text-neutral-500">{t.visualDesc}</p>
              </div>
            )}
            {generatingImage && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="animate-spin text-black" size={32} />
              </div>
            )}
          </div>
          <button 
            onClick={handleGenerateImage}
            disabled={generatingImage}
            className="w-full py-4 bg-white border border-black/5 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-50 transition-all"
          >
            {generatingImage ? t.generating : t.generateVisual}
          </button>
        </div>
      </div>
      <div className="flex justify-center">
        <button onClick={onNext} disabled={loading} className="px-8 py-3 bg-black text-white rounded-xl font-medium flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <BarChart3 size={18} />}
          {t.visualizeImpact}
        </button>
      </div>
    </div>
  );
}

function UserStoriesView({ stories, onNext, loading, lang, onUpdate }: { stories: UserStory[], onNext: () => void, loading: boolean, lang: Language, onUpdate: (s: UserStory[]) => void }) {
  const t = translations[lang];
  const [localStories, setLocalStories] = useState(stories);

  const handleChange = (idx: number, field: keyof UserStory, val: string) => {
    const newStories = [...localStories];
    newStories[idx] = { ...newStories[idx], [field]: val };
    setLocalStories(newStories);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {localStories.map((story, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="p-6 bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all space-y-3"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{t.userStory} {i + 1}</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 shrink-0">As a</span>
                <input 
                  value={story.role} 
                  onChange={(e) => handleChange(i, 'role', e.target.value)}
                  className="w-full font-semibold text-emerald-600 bg-neutral-50 px-2 py-1 rounded border-none focus:ring-1 focus:ring-emerald-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 shrink-0">I want to</span>
                <input 
                  value={story.action} 
                  onChange={(e) => handleChange(i, 'action', e.target.value)}
                  className="w-full font-semibold text-indigo-600 bg-neutral-50 px-2 py-1 rounded border-none focus:ring-1 focus:ring-indigo-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 shrink-0">So that</span>
                <input 
                  value={story.value} 
                  onChange={(e) => handleChange(i, 'value', e.target.value)}
                  className="w-full font-semibold text-neutral-900 bg-neutral-50 px-2 py-1 rounded border-none focus:ring-1 focus:ring-neutral-200"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-4 pt-8">
        <button 
          onClick={() => onUpdate(localStories)}
          className="text-xs font-bold text-neutral-400 hover:text-black transition-all uppercase tracking-widest"
        >
          {t.updateAndRegenerate}
        </button>
        <button
          onClick={onNext}
          disabled={loading}
          className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Brain size={18} />}
          {t.uncoverNeeds}
        </button>
      </div>
    </div>
  );
}

function HiddenNeedsView({ needs, onNext, loading, lang, onUpdate }: { needs: HiddenNeed[], onNext: () => void, loading: boolean, lang: Language, onUpdate: (n: HiddenNeed[]) => void }) {
  const t = translations[lang];
  const [localNeeds, setLocalNeeds] = useState(needs);

  const handleChange = (idx: number, field: keyof HiddenNeed, val: string) => {
    const newNeeds = [...localNeeds];
    newNeeds[idx] = { ...newNeeds[idx], [field]: val };
    setLocalNeeds(newNeeds);
  };

  return (
    <div className="space-y-6">
      <div className="relative p-12 bg-black text-white rounded-[2rem] overflow-hidden mb-8">
        <div className="relative z-10">
          <h3 className="text-2xl font-semibold mb-4 italic serif">{t.icebergTitle}</h3>
          <p className="text-neutral-400 max-w-md">{t.icebergDesc}</p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {localNeeds.map((need, i) => (
          <div key={i} className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-black/5">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
              {i + 1}
            </div>
            <div className="flex-grow space-y-2">
              <input 
                value={need.category} 
                onChange={(e) => handleChange(i, 'category', e.target.value)}
                className="w-full font-bold text-xs uppercase tracking-wider text-emerald-600 bg-neutral-50 px-2 py-1 rounded border-none focus:ring-1 focus:ring-emerald-100"
              />
              <textarea 
                value={need.description} 
                onChange={(e) => handleChange(i, 'description', e.target.value)}
                className="w-full text-neutral-700 bg-neutral-50 px-2 py-1 rounded border-none focus:ring-1 focus:ring-neutral-200 resize-none"
                rows={2}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 pt-8">
        <button 
          onClick={() => onUpdate(localNeeds)}
          className="text-xs font-bold text-neutral-400 hover:text-black transition-all uppercase tracking-widest"
        >
          {t.updateAndRegenerate}
        </button>
        <button
          onClick={onNext}
          disabled={loading}
          className="px-8 py-3 bg-black text-white rounded-xl font-medium hover:bg-neutral-800 transition-all flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Map size={18} />}
          {t.mapJourney}
        </button>
      </div>
    </div>
  );
}

function JourneyMapView({ map, onNext, loading, lang, onUpdate }: { map: JourneyPoint[], onNext: () => void, loading: boolean, lang: Language, onUpdate: (m: JourneyPoint[]) => void }) {
  const t = translations[lang];
  const [localMap, setLocalMap] = useState(map);

  const handleChange = (idx: number, field: keyof JourneyPoint, val: string | number) => {
    const newMap = [...localMap];
    newMap[idx] = { ...newMap[idx], [field]: val };
    setLocalMap(newMap);
  };

  return (
    <div className="space-y-8">
      <div className="h-[300px] w-full bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={localMap}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="title" hide />
            <YAxis hide domain={[0, 10]} />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Line 
              type="monotone" 
              dataKey="emotion" 
              stroke="#10b981" 
              strokeWidth={3} 
              dot={{ r: 6, fill: '#10b981', strokeWidth: 0 }} 
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[t.before, t.during, t.after].map((phaseLabel, idx) => {
          const phaseKey = ['Before', 'During', 'After'][idx];
          return (
            <div key={phaseKey} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 px-2">{phaseLabel}</h4>
              {localMap.map((point, i) => point.phase === phaseKey ? (
                <div key={i} className="p-5 bg-white rounded-2xl border border-black/5 shadow-sm space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <input 
                      value={point.title} 
                      onChange={(e) => handleChange(i, 'title', e.target.value)}
                      className="w-full font-semibold text-sm bg-neutral-50 px-2 py-1 rounded border-none focus:ring-1 focus:ring-black/10"
                    />
                    <input 
                      type="number"
                      min="1"
                      max="10"
                      value={point.emotion} 
                      onChange={(e) => handleChange(i, 'emotion', parseInt(e.target.value))}
                      className="w-12 text-[10px] font-bold px-1 py-1 bg-emerald-50 text-emerald-700 rounded-full text-center border-none focus:ring-1 focus:ring-emerald-200"
                    />
                  </div>
                  <textarea 
                    value={point.description} 
                    onChange={(e) => handleChange(i, 'description', e.target.value)}
                    className="w-full text-xs text-neutral-500 leading-relaxed bg-neutral-50 px-2 py-1 rounded border-none focus:ring-1 focus:ring-black/10 resize-none"
                    rows={2}
                  />
                </div>
              ) : null)}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col items-center gap-4">
        <button 
          onClick={() => onUpdate(localMap)}
          className="text-xs font-bold text-neutral-400 hover:text-black transition-all uppercase tracking-widest"
        >
          {t.updateAndRegenerate}
        </button>
        <button onClick={onNext} disabled={loading} className="px-8 py-3 bg-black text-white rounded-xl font-medium flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Layers size={18} />}
          {t.generateBlueprint}
        </button>
      </div>
    </div>
  );
}

function PitchView({ pitch, lang, onDownload, onUpdate }: { pitch: string, lang: Language, onDownload: () => void, onUpdate: (p: string) => void }) {
  const t = translations[lang];
  const [localPitch, setLocalPitch] = useState(pitch);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 gap-8">
        <div className="p-12 bg-white rounded-[3rem] border border-black/5 shadow-2xl relative flex flex-col min-h-[500px]">
          <div className="absolute -top-6 -left-6 w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white">
            <Presentation size={24} />
          </div>
          <h3 className="text-2xl font-semibold mb-8 italic serif">{t.pitchTitle}</h3>
          <textarea
            value={localPitch}
            onChange={(e) => setLocalPitch(e.target.value)}
            className="flex-grow w-full p-4 bg-transparent border-none focus:ring-0 focus:outline-none resize-none text-sm leading-relaxed"
          />
          <div className="mt-8 pt-8 border-t border-black/5 flex justify-between items-center">
            <button 
              onClick={() => onUpdate(localPitch)}
              className="text-xs font-bold text-neutral-400 hover:text-black transition-all uppercase tracking-widest"
            >
              {t.saveChanges}
            </button>
            <button 
              onClick={onDownload}
              className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              <Upload className="rotate-180" size={20} />
              {t.exportPdf}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBot({ isOpen, onClose, lang }: { isOpen: boolean, onClose: () => void, lang: Language }) {
  const t = translations[lang];
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: t.coachGreeting }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const ai = gemini.getGeminiModel();
      const chat = ai.chats.create({ 
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: `You are an EMBA Strategy Coach. Help the user refine their journey strategy. 
          Respond in ${lang === 'zh' ? 'Traditional Chinese' : 'English'}.`
        }
      });
      const response = await chat.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'ai', content: response.text || (lang === 'zh' ? "抱歉，我無法處理該請求。" : "I'm sorry, I couldn't process that.") }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl flex flex-col h-[600px] overflow-hidden border border-black/5"
      >
        <div className="p-6 border-bottom flex justify-between items-center bg-neutral-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-semibold">{t.coachTitle}</h3>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">{t.coachSub}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-200 rounded-full transition-all">
            <ChevronRight className="rotate-90" size={20} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              "flex",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}>
              <div className={cn(
                "max-w-[80%] p-4 rounded-2xl text-sm",
                msg.role === 'user' 
                  ? "bg-black text-white rounded-tr-none" 
                  : "bg-neutral-100 text-neutral-800 rounded-tl-none"
              )}>
                <Markdown>{msg.content}</Markdown>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-neutral-100 p-4 rounded-2xl rounded-tl-none">
                <Loader2 className="animate-spin text-neutral-400" size={16} />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-neutral-50 border-t border-black/5">
          <div className="relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.askQuestion}
              className="w-full pl-6 pr-12 py-4 bg-white border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5"
            />
            <button 
              onClick={handleSend}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black text-white rounded-xl"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
