import React, { useState, useEffect } from 'react';
import { PhoneIcon, PauseIcon, PlayIcon, ClockIcon, CheckIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const PowerDialerPage = () => {
  // State für den PowerDialer
  const [dialerActive, setDialerActive] = useState(false);
  const [remainingCalls, setRemainingCalls] = useState(12);
  const [callsMade, setCallsMade] = useState(3);
  const [successRate, setSuccessRate] = useState(66.7);
  const [remainingTime, setRemainingTime] = useState(15 * 60); // 15 Minuten in Sekunden
  const [timerRunning, setTimerRunning] = useState(false);
  
  // Beispiel-Daten für aktuelle Kontakte und To-Dos
  const [currentContact, setCurrentContact] = useState({
    name: "Maria Schmidt",
    phone: "+49 123 4567890",
    email: "maria.schmidt@example.com",
    previousAttempts: 2,
    lastContact: "2025-04-08 14:30",
    notes: "War beim letzten Mal interessiert, hatte jedoch noch Bedenken wegen der Kosten."
  });
  
  const [contactQueue, setContactQueue] = useState([
    { id: 1, name: "Thomas Müller", phone: "+49 123 4567891" },
    { id: 2, name: "Anna Weber", phone: "+49 123 4567892" },
    { id: 3, name: "Klaus Fischer", phone: "+49 123 4567893" }
  ]);
  
  const [todos, setTodos] = useState([
    { id: 1, text: "Kunden zurückrufen", completed: false, priority: "high" },
    { id: 2, text: "Formulare vorbereiten", completed: true, priority: "medium" },
    { id: 3, text: "Team-Meeting um 16:00", completed: false, priority: "medium" },
    { id: 4, text: "E-Mail an Rechtsabteilung", completed: false, priority: "low" }
  ]);
  
  // Formular Felder
  const [formData, setFormData] = useState({
    interesse: "",
    einkommensquellen: "",
    monatlichesEinkommen: "",
    schuldenHoehe: "",
    gerichtlicheMassnahmen: "nein",
    notizen: ""
  });
  
  // Timer-Logik
  useEffect(() => {
    let interval;
    
    if (timerRunning && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (remainingTime === 0) {
      setTimerRunning(false);
    }
    
    return () => clearInterval(interval);
  }, [timerRunning, remainingTime]);
  
  // Timer formatieren
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  // Timer-Farbe basierend auf verbleibender Zeit
  const getTimerColor = () => {
    if (remainingTime <= 60) return "text-red-500";
    if (remainingTime <= 120) return "text-orange-400";
    if (remainingTime <= 300) return "text-amber-400";
    return "text-blue-500";
  };
  
  // PowerDialer aktivieren/deaktivieren
  const toggleDialer = () => {
    setDialerActive(!dialerActive);
    if (!dialerActive) {
      setTimerRunning(true);
    } else {
      setTimerRunning(false);
    }
  };
  
  // Todo abhaken
  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };
  
  // Nächster Kontakt
  const nextContact = () => {
    if (contactQueue.length > 0) {
      const newQueue = [...contactQueue];
      const nextContactPerson = newQueue.shift();
      setCurrentContact({
        ...nextContactPerson,
        previousAttempts: 0,
        lastContact: "Noch kein Kontakt",
        notes: ""
      });
      setContactQueue(newQueue);
      setRemainingTime(15 * 60);
      setTimerRunning(true);
      setCallsMade(prevCalls => prevCalls + 1);
      setRemainingCalls(prevRemaining => prevRemaining - 1);
    }
  };
  
  // Formular-Änderungen
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <div className="container mx-auto px-4 py-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-3xl font-medium text-gray-900">Power-Dialer</h1>
        <p className="text-gray-500 mt-1">Verkaufsteam-Dashboard</p>
      </div>
      
      {/* Haupt-Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Linker Bereich - PowerDialer Steuerung & ToDos (25%) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* PowerDialer Steuerung */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-5 flex items-center">
              <PhoneIcon className="w-5 h-5 mr-2 text-blue-500" />
              PowerDialer-Steuerung
            </h2>
            
            <div className="flex justify-center mb-8">
              <button
                onClick={toggleDialer}
                className={`relative flex items-center justify-center w-24 h-24 rounded-full shadow-lg transition-all duration-300 ${
                  dialerActive 
                    ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                }`}
              >
                {dialerActive ? (
                  <PauseIcon className="w-12 h-12 text-white" />
                ) : (
                  <PlayIcon className="w-12 h-12 text-white ml-1" />
                )}
                <div className="absolute -bottom-9 text-sm font-medium bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                  {dialerActive ? 'AKTIV' : 'INAKTIV'}
                </div>
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mt-10 text-center">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="text-2xl font-medium text-gray-900">{remainingCalls}</div>
                <div className="text-xs text-gray-500 mt-1">Verbleibend</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="text-2xl font-medium text-gray-900">{callsMade}</div>
                <div className="text-xs text-gray-500 mt-1">Anrufe heute</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="text-2xl font-medium text-gray-900">{successRate}%</div>
                <div className="text-xs text-gray-500 mt-1">Erfolgsrate</div>
              </div>
            </div>
          </div>
          
          {/* To-Do Liste */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">To-Do Liste</h2>
            
            <div className="space-y-3 mb-4">
              {todos.map(todo => (
                <div 
                  key={todo.id}
                  className={`flex items-center p-3 rounded-xl transition-all duration-200 ${
                    todo.completed ? 'bg-gray-50 text-gray-400' : 
                    todo.priority === 'high' ? 'bg-red-50' : 
                    todo.priority === 'medium' ? 'bg-amber-50' : 'bg-blue-50'
                  }`}
                >
                  <button 
                    onClick={() => toggleTodo(todo.id)}
                    className={`flex-shrink-0 w-6 h-6 mr-3 rounded-full border-2 transition-all duration-200 ${
                      todo.completed 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300 hover:border-blue-400'
                    } flex items-center justify-center`}
                  >
                    {todo.completed && <CheckIcon className="w-4 h-4 text-white" />}
                  </button>
                  <span className={`flex-grow text-sm ${todo.completed ? 'line-through' : ''}`}>
                    {todo.text}
                  </span>
                </div>
              ))}
            </div>
            
            <button className="w-full py-2.5 text-sm text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center mt-2">
              <span className="text-blue-500 mr-1 text-lg font-light leading-none">+</span> Neue Aufgabe
            </button>
          </div>
        </div>
        
        {/* Mittlerer Bereich - Formular (50%) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-5">Kundendaten-Erfassung</h2>
          
          <div className="mb-6">
            <div className="flex items-center space-x-3 text-sm mb-6">
              <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100 font-medium">PowerData-Link verfügbar</span>
              <a href="#" className="text-blue-500 hover:text-blue-700 transition-colors duration-200 font-medium">Daten abrufen</a>
            </div>
            
            <form className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Interesse an Beratung
                  </label>
                  <select 
                    name="interesse" 
                    value={formData.interesse}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                  >
                    <option value="">Bitte auswählen</option>
                    <option value="hoch">Hohes Interesse</option>
                    <option value="mittel">Mittleres Interesse</option>
                    <option value="niedrig">Niedriges Interesse</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Einkommensquellen
                  </label>
                  <select 
                    name="einkommensquellen" 
                    value={formData.einkommensquellen}
                    onChange={handleFormChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                  >
                    <option value="">Bitte auswählen</option>
                    <option value="anstellung">Feste Anstellung</option>
                    <option value="selbständig">Selbständigkeit</option>
                    <option value="sozialleistungen">Sozialleistungen</option>
                    <option value="gemischt">Gemischte Quellen</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Monatliches Einkommen (ca.)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">€</span>
                    <input 
                      type="text"
                      name="monatlichesEinkommen"
                      value={formData.monatlichesEinkommen}
                      onChange={handleFormChange}
                      placeholder="z.B. 2500"
                      className="w-full p-3 pl-8 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Höhe der Schulden (ca.)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">€</span>
                    <input 
                      type="text"
                      name="schuldenHoehe"
                      value={formData.schuldenHoehe}
                      onChange={handleFormChange}
                      placeholder="z.B. 15000"
                      className="w-full p-3 pl-8 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Gerichtliche Maßnahmen eingeleitet?
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative flex items-center">
                      <input 
                        type="radio" 
                        name="gerichtlicheMassnahmen" 
                        value="ja"
                        checked={formData.gerichtlicheMassnahmen === "ja"}
                        onChange={handleFormChange}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border ${formData.gerichtlicheMassnahmen === "ja" ? 'border-blue-500' : 'border-gray-300'} flex items-center justify-center`}>
                        {formData.gerichtlicheMassnahmen === "ja" && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                      </div>
                    </div>
                    <span className="ml-2 text-gray-700">Ja</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative flex items-center">
                      <input 
                        type="radio" 
                        name="gerichtlicheMassnahmen" 
                        value="nein"
                        checked={formData.gerichtlicheMassnahmen === "nein"}
                        onChange={handleFormChange}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border ${formData.gerichtlicheMassnahmen === "nein" ? 'border-blue-500' : 'border-gray-300'} flex items-center justify-center`}>
                        {formData.gerichtlicheMassnahmen === "nein" && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                      </div>
                    </div>
                    <span className="ml-2 text-gray-700">Nein</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notizen zum Gespräch
                </label>
                <textarea 
                  name="notizen"
                  value={formData.notizen}
                  onChange={handleFormChange}
                  rows="4"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                  placeholder="Wichtige Informationen aus dem Gespräch..."
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button"
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Zurücksetzen
                </button>
                <button 
                  type="button"
                  className="px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 font-medium shadow-sm"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Rechter Bereich - Kontakt & Timer (25%) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Kontaktinformationen */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Aktueller Kontakt</h2>
            
            <div className="text-center mb-5">
              <h3 className="text-2xl font-medium text-gray-900">{currentContact.name}</h3>
              <a href={`tel:${currentContact.phone}`} className="text-blue-500 hover:text-blue-700 transition-colors duration-200 block mb-1 mt-1">
                {currentContact.phone}
              </a>
              <a href={`mailto:${currentContact.email}`} className="text-blue-500 hover:text-blue-700 transition-colors duration-200 text-sm">
                {currentContact.email}
              </a>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Bisherige Versuche:</span>
                <span className="font-medium text-gray-900">{currentContact.previousAttempts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Letzter Kontakt:</span>
                <span className="font-medium text-gray-900">{currentContact.lastContact}</span>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-medium text-sm mb-2 text-gray-700">Notizen zu vorherigen Gesprächen:</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">{currentContact.notes}</p>
            </div>
          </div>
          
          {/* Timer */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2 text-blue-500" />
              Timer
            </h2>
            
            <div className="text-center mb-5">
              <div className={`text-5xl font-light ${getTimerColor()} font-mono tracking-wider`}>
                {formatTime(remainingTime)}
              </div>
              <p className="text-sm text-gray-500 mt-2">Verbleibende Zeit für dieses Gespräch</p>
            </div>
            
            <div className="flex justify-center space-x-3">
              <button 
                onClick={() => setTimerRunning(!timerRunning)}
                className={`px-4 py-2 rounded-xl border transition-all duration-200 ${
                  timerRunning 
                    ? 'border-red-100 text-red-500 bg-red-50 hover:bg-red-100' 
                    : 'border-blue-100 text-blue-500 bg-blue-50 hover:bg-blue-100'
                } font-medium`}
              >
                {timerRunning ? 'Pause' : 'Start'}
              </button>
              <button 
                onClick={() => setRemainingTime(15 * 60)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all duration-200 font-medium"
              >
                Reset (15:00)
              </button>
            </div>
          </div>
          
          {/* Warteschlange */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Nächste Kontakte</h2>
            
            <div className="space-y-3 mb-5">
              {contactQueue.slice(0, 3).map(contact => (
                <div key={contact.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-all duration-200">
                  <div className="font-medium text-gray-900">{contact.name}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{contact.phone}</div>
                </div>
              ))}
              
              {contactQueue.length === 0 && (
                <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-xl border border-gray-100">
                  Keine weiteren Kontakte in der Warteschlange
                </div>
              )}
            </div>
            
            <button 
              onClick={nextContact}
              disabled={contactQueue.length === 0}
              className={`w-full flex items-center justify-center py-3 rounded-xl shadow-sm transition-all duration-200 font-medium ${
                contactQueue.length > 0 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Nächster Kontakt
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerDialerPage;