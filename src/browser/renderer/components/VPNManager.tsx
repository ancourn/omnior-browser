import React, { useState, useEffect } from 'react';
import { Globe, Shield, Wifi, WifiOff, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useBrowserStore } from '../store/browserStore';

interface VPNManagerProps {
  tabId: string;
  className?: string;
}

const VPN_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
];

export const VPNManager: React.FC<VPNManagerProps> = ({ tabId, className = '' }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(VPN_COUNTRIES[0]);
  
  const { tabs, updateTab } = useBrowserStore();
  
  const tab = tabs.find(t => t.id === tabId);
  const isVPNEnabled = tab?.vpnEnabled || false;
  const currentCountry = tab?.vpnCountry || selectedCountry.code;

  useEffect(() => {
    // Update selected country if tab's VPN country changes
    if (tab?.vpnCountry) {
      const country = VPN_COUNTRIES.find(c => c.code === tab.vpnCountry);
      if (country) {
        setSelectedCountry(country);
      }
    }
  }, [tab?.vpnCountry]);

  const handleToggleVPN = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    
    try {
      if (isVPNEnabled) {
        // Disconnect VPN
        await updateTab(tabId, { 
          vpnEnabled: false, 
          vpnCountry: undefined 
        });
      } else {
        // Connect VPN
        await updateTab(tabId, { 
          vpnEnabled: true, 
          vpnCountry: selectedCountry.code 
        });
      }
    } catch (error) {
      console.error('Failed to toggle VPN:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCountrySelect = (country: typeof VPN_COUNTRIES[0]) => {
    setSelectedCountry(country);
    
    if (isVPNEnabled) {
      // Update VPN country if already connected
      updateTab(tabId, { vpnCountry: country.code });
    }
    
    setShowCountrySelector(false);
  };

  const getCurrentCountryInfo = () => {
    return VPN_COUNTRIES.find(c => c.code === currentCountry) || VPN_COUNTRIES[0];
  };

  const currentCountryInfo = getCurrentCountryInfo();

  if (!tab) return null;

  return (
    <div className={`vpn-manager ${className}`}>
      <DropdownMenu open={showCountrySelector} onOpenChange={setShowCountrySelector}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`vpn-toggle ${isVPNEnabled ? 'vpn-active' : 'vpn-inactive'}`}
            onClick={handleToggleVPN}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <div className="spinner w-4 h-4" />
            ) : isVPNEnabled ? (
              <Shield className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            
            {isVPNEnabled && (
              <span className="vpn-country-flag ml-1">
                {currentCountryInfo.flag}
              </span>
            )}
            
            <Badge 
              variant={isVPNEnabled ? "default" : "secondary"} 
              className="ml-1 text-xs"
            >
              {isVPNEnabled ? currentCountryInfo.code : 'VPN'}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">VPN Status</span>
              <Badge variant={isVPNEnabled ? "default" : "secondary"}>
                {isVPNEnabled ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            
            {isVPNEnabled && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Globe className="w-4 h-4" />
                <span>{currentCountryInfo.name} {currentCountryInfo.flag}</span>
              </div>
            )}
          </div>
          
          <DropdownMenuSeparator />
          
          <div className="p-2">
            <div className="text-sm font-medium mb-2">Select Location</div>
            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
              {VPN_COUNTRIES.map((country) => (
                <DropdownMenuItem
                  key={country.code}
                  onClick={() => handleCountrySelect(country)}
                  className={`flex items-center gap-2 ${
                    selectedCountry.code === country.code ? 'bg-accent' : ''
                  }`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="text-sm">{country.name}</span>
                  {selectedCountry.code === country.code && (
                    <Check className="w-3 h-3 ml-auto" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          <div className="p-2">
            <Button
              variant={isVPNEnabled ? "destructive" : "default"}
              size="sm"
              onClick={handleToggleVPN}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <div className="spinner w-4 h-4 mr-2" />
                  Connecting...
                </>
              ) : isVPNEnabled ? (
                <>
                  <WifiOff className="w-4 h-4 mr-2" />
                  Disconnect VPN
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-2" />
                  Connect VPN
                </>
              )}
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};