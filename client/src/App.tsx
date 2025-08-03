
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Users, Target } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { PublicInterface } from '@/components/PublicInterface';
import { AdminInterface } from '@/components/AdminInterface';
import type { Campaign, Organization } from '../../server/src/schema';

function App() {
  const [activeTab, setActiveTab] = useState<'public' | 'admin'>('public');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [campaignsData, organizationsData] = await Promise.all([
        trpc.getCampaigns.query(),
        trpc.getOrganizations.query()
      ]);
      setCampaigns(campaignsData);
      setOrganizations(organizationsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-gradient-to-r from-blue-500 to-purple-600">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  💝 DonateHeart
                </h1>
                <p className="text-gray-600 text-sm">Making a difference, one donation at a time</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>Active Campaigns: {campaigns.filter(c => c.is_active).length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span>Total Organizations: {organizations.length}</span>
                </div>
              </div>
              
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'public' | 'admin')}>
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="public" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                    🌟 Public Site
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                    ⚙️ Admin Panel
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading donation platform...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'public' && (
              <PublicInterface 
                campaigns={campaigns}
                organizations={organizations}
                onRefresh={refreshData}
              />
            )}
            {activeTab === 'admin' && (
              <AdminInterface 
                campaigns={campaigns}
                organizations={organizations}
                onRefresh={refreshData}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">🎯 About DonateHeart</h3>
              <p className="text-gray-600 text-sm">
                A transparent crowdfunding platform connecting generous hearts with meaningful causes. 
                Every donation makes a difference! 💖
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">📊 Quick Stats</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Active Campaigns:</span>
                  <span className="font-medium text-blue-600">{campaigns.filter(c => c.is_active).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Raised:</span>
                  <span className="font-medium text-green-600">
                    IDR {campaigns.reduce((sum, c) => sum + c.current_amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">💡 How It Works</h3>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Browse active campaigns 🔍</li>
                <li>2. Choose amount to donate 💰</li>
                <li>3. Transfer via bank 🏦</li>
                <li>4. Make a difference! ✨</li>
              </ol>
            </div>
          </div>
          <div className="border-t mt-8 pt-4 text-center text-sm text-gray-500">
            <p>© 2024 DonateHeart. Spreading love through giving. 💝</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
