import React, { useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { 
  UserIcon, LockClosedIcon, CheckIcon, ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

const SettingsPage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Form states
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  
  // Handle profile form changes
  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };
  
  // Handle password form changes
  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };
  
  // Submit profile update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });
    
    // Basic validation
    if (!profileForm.name || !profileForm.email) {
      setProfileMessage({ 
        type: 'error', 
        text: 'Name und E-Mail-Adresse sind erforderlich' 
      });
      setProfileLoading(false);
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileForm.email)) {
      setProfileMessage({ 
        type: 'error', 
        text: 'Bitte geben Sie eine gültige E-Mail-Adresse ein' 
      });
      setProfileLoading(false);
      return;
    }
    
    try {
      const success = await updateProfile(profileForm);
      
      if (success) {
        setProfileMessage({ 
          type: 'success', 
          text: 'Profil erfolgreich aktualisiert' 
        });
      } else {
        setProfileMessage({ 
          type: 'error', 
          text: 'Fehler beim Aktualisieren des Profils' 
        });
      }
    } catch (error) {
      setProfileMessage({ 
        type: 'error', 
        text: 'Fehler beim Aktualisieren des Profils' 
      });
    } finally {
      setProfileLoading(false);
    }
  };
  
  // Submit password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });
    
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'Bitte füllen Sie alle Passwortfelder aus' 
      });
      setPasswordLoading(false);
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'Die neuen Passwörter stimmen nicht überein' 
      });
      setPasswordLoading(false);
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'Das neue Passwort muss mindestens 6 Zeichen lang sein' 
      });
      setPasswordLoading(false);
      return;
    }
    
    try {
      const result = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      if (result.success) {
        setPasswordMessage({ type: 'success', text: result.message });
        // Reset form on success
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setPasswordMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'Fehler beim Ändern des Passworts' 
      });
    } finally {
      setPasswordLoading(false);
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Einstellungen</h1>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Profile Settings */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 text-blue-900 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Profil</h2>
            </div>
          </div>
          
          <div className="p-6">
            {profileMessage.text && (
              <div 
                className={`mb-6 p-4 rounded-md ${
                  profileMessage.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                <div className="flex items-center">
                  {profileMessage.type === 'success' ? (
                    <CheckIcon className="h-5 w-5 mr-2" />
                  ) : (
                    <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                  )}
                  {profileMessage.text}
                </div>
              </div>
            )}
            
            <form onSubmit={handleProfileSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    placeholder="Ihr Name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail-Adresse
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    placeholder="Ihre E-Mail-Adresse"
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className={`w-full py-2 px-4 bg-blue-900 text-white font-medium rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 ${
                      profileLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {profileLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Speichern...
                      </div>
                    ) : (
                      'Profil speichern'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      
        {/* Password Settings */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center">
              <LockClosedIcon className="h-5 w-5 text-blue-900 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">Passwort ändern</h2>
            </div>
          </div>
          
          <div className="p-6">
            {passwordMessage.text && (
              <div 
                className={`mb-6 p-4 rounded-md ${
                  passwordMessage.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                <div className="flex items-center">
                  {passwordMessage.type === 'success' ? (
                    <CheckIcon className="h-5 w-5 mr-2" />
                  ) : (
                    <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                  )}
                  {passwordMessage.text}
                </div>
              </div>
            )}
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Aktuelles Passwort
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    placeholder="Ihr aktuelles Passwort"
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Neues Passwort
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    placeholder="Ihr neues Passwort"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Neues Passwort bestätigen
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                    placeholder="Neues Passwort wiederholen"
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className={`w-full py-2 px-4 bg-blue-900 text-white font-medium rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 ${
                      passwordLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {passwordLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Passwort ändern...
                      </div>
                    ) : (
                      'Passwort ändern'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;