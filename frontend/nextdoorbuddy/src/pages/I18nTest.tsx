import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import LanguageSelector from '../components/LanguageSelector';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

const I18nTest: React.FC = () => {
  const { t, i18n } = useTranslation();

  const testTranslations = [
    { key: 'navigation.home', section: 'Navigation' },
    { key: 'navigation.events', section: 'Navigation' },
    { key: 'navigation.trocs', section: 'Navigation' },
    { key: 'auth.login.title', section: 'Authentication' },
    { key: 'auth.login.subtitle', section: 'Authentication' },
    { key: 'auth.signup.title', section: 'Authentication' },
    { key: 'home.welcome', section: 'Home', params: { name: 'John' } },
    { key: 'home.subtitle', section: 'Home' },
    { key: 'events.title', section: 'Events' },
    { key: 'events.createEvent', section: 'Events' },
    { key: 'trocs.title', section: 'Trocs' },
    { key: 'chat.title', section: 'Chat' },
    { key: 'profile.title', section: 'Profile' },
    { key: 'common.loading', section: 'Common' },
    { key: 'common.error', section: 'Common' },
    { key: 'common.success', section: 'Common' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              i18n Implementation Test
            </h1>
            <p className="text-gray-600 mb-6">
              Current Language: <span className="font-semibold">{i18n.language}</span>
            </p>
            
            <div className="flex justify-center mb-6">
              <LanguageSelector />
            </div>
          </div>

          <div className="grid gap-6">
            {testTranslations.reduce((acc, translation) => {
              const existingSection = acc.find(section => section.title === translation.section);
              if (existingSection) {
                existingSection.items.push(translation);
              } else {
                acc.push({
                  title: translation.section,
                  items: [translation]
                });
              }
              return acc;
            }, [] as Array<{ title: string; items: typeof testTranslations }>).map((section) => (
              <Card key={section.title} className="shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                    {section.title}
                  </h2>
                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <div key={item.key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <code className="text-sm text-blue-600 font-mono">{item.key}</code>
                        </div>
                        <div className="flex-1 text-right">
                          <span className="text-gray-800 font-medium">
                            {item.params ? t(item.key, item.params) : t(item.key)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Language Switching Test
              </h3>
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={() => i18n.changeLanguage('fr')}
                  variant={i18n.language === 'fr' ? 'default' : 'outline'}
                >
                  🇫🇷 Français
                </Button>
                <Button 
                  onClick={() => i18n.changeLanguage('en')}
                  variant={i18n.language === 'en' ? 'default' : 'outline'}
                >
                  🇺🇸 English
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default I18nTest;
