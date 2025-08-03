
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Heart, Users, Calendar, DollarSign, Gift, Sparkles } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Campaign, Organization, Donation, CreateDonationInput } from '../../../server/src/schema';
import type { CampaignWithStats } from '../../../server/src/handlers/get_campaign_with_stats';

interface PublicInterfaceProps {
  campaigns: Campaign[];
  organizations: Organization[];
  onRefresh: () => void;
}

export function PublicInterface({ campaigns, organizations, onRefresh }: PublicInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithStats | null>(null);
  const [latestDonors, setLatestDonors] = useState<Donation[]>([]);
  const [searchedDonors, setSearchedDonors] = useState<Donation[]>([]);
  const [donorSearchQuery, setDonorSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDonating, setIsDonating] = useState(false);

  // Donation form state
  const [donationForm, setDonationForm] = useState<CreateDonationInput>({
    campaign_id: 0,
    donor_name: '',
    donor_email: null,
    donor_phone: null,
    amount: 0,
    message: null
  });

  const activeCampaigns = campaigns.filter(campaign => campaign.is_active);
  
  const filteredCampaigns = activeCampaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOrganizationName = useCallback((orgId: number) => {
    const org = organizations.find(o => o.id === orgId);
    return org?.name || 'Unknown Organization';
  }, [organizations]);

  const getOrganizationLogo = useCallback((orgId: number) => {
    const org = organizations.find(o => o.id === orgId);
    return org?.logo_url;
  }, [organizations]);

  const calculateProgress = useCallback((current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  }, []);

  const loadCampaignDetails = useCallback(async (campaignId: number) => {
    try {
      setIsLoading(true);
      const [campaignStats, donors] = await Promise.all([
        trpc.getCampaignWithStats.query({ id: campaignId }),
        trpc.getLatestDonors.query({ campaign_id: campaignId, limit: 5 })
      ]);
      
      if (campaignStats) {
        setSelectedCampaign(campaignStats);
      }
      setLatestDonors(donors);
    } catch (error) {
      console.error('Failed to load campaign details:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchDonors = useCallback(async () => {
    if (!donorSearchQuery.trim() || !selectedCampaign) return;
    
    try {
      const results = await trpc.searchDonors.query({
        query: donorSearchQuery,
        campaign_id: selectedCampaign.id
      });
      setSearchedDonors(results);
    } catch (error) {
      console.error('Failed to search donors:', error);
    }
  }, [donorSearchQuery, selectedCampaign]);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    try {
      setIsDonating(true);
      await trpc.createDonation.mutate({
        ...donationForm,
        campaign_id: selectedCampaign.id
      });
      
      // Reset form
      setDonationForm({
        campaign_id: 0,
        donor_name: '',
        donor_email: null,
        donor_phone: null,
        amount: 0,
        message: null
      });
      
      // Refresh data
      onRefresh();
      await loadCampaignDetails(selectedCampaign.id);
      
      alert('🎉 Thank you for your donation! Please transfer to the provided bank account. Your donation will be confirmed once payment is received.');
    } catch (error) {
      console.error('Failed to create donation:', error);
      alert('❌ Failed to submit donation. Please try again.');
    } finally {
      setIsDonating(false);
    }
  };

  useEffect(() => {
    if (donorSearchQuery.trim()) {
      const debounceTimer = setTimeout(searchDonors, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchedDonors([]);
    }
  }, [donorSearchQuery, searchDonors]);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl text-white shadow-2xl">
        <h2 className="text-4xl font-bold mb-4">✨ Make a Difference Today</h2>
        <p className="text-xl mb-6 opacity-90">
          Join thousands of generous hearts supporting meaningful causes 💖
        </p>
        <div className="flex items-center justify-center space-x-8 text-lg">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-pink-200" />
            <span>{activeCampaigns.length} Active Campaigns</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-green-200" />
            <span>IDR {activeCampaigns.reduce((sum, c) => sum + c.current_amount, 0).toLocaleString()} Raised</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="🔍 Search campaigns by name or description..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10 text-lg py-3 border-2 border-gray-200 focus:border-blue-500"
          />
        </div>
        {searchQuery && (
          <Button 
            variant="outline" 
            onClick={() => setSearchQuery('')}
            className="text-gray-500 hover:text-red-500"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Campaigns Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCampaigns.map((campaign: Campaign) => {
          const progress = calculateProgress(campaign.current_amount, campaign.target_amount);
          const orgName = getOrganizationName(campaign.organization_id);
          const orgLogo = getOrganizationLogo(campaign.organization_id);
          
          return (
            <Card key={campaign.id} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="h-10 w-10 border-2 border-blue-200">
                    <AvatarImage src={orgLogo || ''} alt={orgName} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                      {orgName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{orgName}</p>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{campaign.created_at.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <CardTitle className="text-xl leading-tight">{campaign.name}</CardTitle>
                {campaign.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">{campaign.description}</p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-bold text-blue-600">{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-semibold">
                      💰 IDR {campaign.current_amount.toLocaleString()}
                    </span>
                    <span className="text-gray-500">
                      🎯 IDR {campaign.target_amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg"
                      onClick={() => loadCampaignDetails(campaign.id)}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Donate Now ✨
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl flex items-center space-x-2">
                        <Heart className="h-6 w-6 text-red-500" />
                        <span>Support: {campaign.name}</span>
                      </DialogTitle>
                    </DialogHeader>
                    
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    ) : selectedCampaign && (
                      <div className="grid md:grid-cols-2 gap-8">
                        {/* Campaign Details */}
                        <div className="space-y-6">
                          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                            <div className="flex items-center justify-center space-x-3 mb-4">
                              <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                                <AvatarImage src={orgLogo || ''} alt={orgName} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl font-bold">
                                  {orgName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-xl font-bold text-gray-800">{orgName}</h3>
                                <Badge variant="secondary" className="mt-1">Organization</Badge>
                              </div>
                            </div>
                            
                            <div className="space-y-3 mb-6">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-bold text-blue-600">{selectedCampaign.progress_percentage.toFixed(1)}%</span>
                              </div>
                              <Progress value={selectedCampaign.progress_percentage} className="h-4" />
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="text-center p-3 bg-white rounded-lg">
                                  <p className="text-green-600 font-bold text-lg">IDR {selectedCampaign.current_amount.toLocaleString()}</p>
                                  <p className="text-gray-500">Raised</p>
                                </div>
                                <div className="text-center p-3 bg-white rounded-lg">
                                  <p className="text-blue-600 font-bold text-lg">{selectedCampaign.total_donors}</p>
                                  <p className="text-gray-500">Donors</p>
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-gray-700 leading-relaxed">{selectedCampaign.description}</p>
                          </div>

                          {/* Latest Donors */}
                          <div className="space-y-4">
                            <h4 className="font-semibold text-lg flex items-center space-x-2">
                              <Users className="h-5 w-5 text-blue-500" />
                              <span>💝 Latest Supporters</span>
                            </h4>
                            {latestDonors.length === 0 ? (
                              <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                                🌟 Be the first to support this campaign!
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {latestDonors.map((donor: Donation) => (
                                  <div key={donor.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                                    <div className="flex items-center space-x-3">
                                      <Avatar className="h-8 w-8 bg-gradient-to-br from-green-400 to-blue-500">
                                        <AvatarFallback className="text-white text-sm font-bold">
                                          {donor.donor_name.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-gray-800">{donor.donor_name}</p>
                                        {donor.message && (
                                          <p className="text-xs text-gray-600 italic">"{donor.message}"</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-green-600">IDR {donor.amount.toLocaleString()}</p>
                                      <p className="text-xs text-gray-500">{donor.created_at.toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Donor Search */}
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <Search className="h-4 w-4 text-gray-400" />
                                <Input
                                  placeholder="🔍 Search donors by name..."
                                  value={donorSearchQuery}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDonorSearchQuery(e.target.value)}
                                  className="flex-1"
                                />
                              </div>
                              {searchedDonors.length > 0 && (
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {searchedDonors.map((donor: Donation) => (
                                    <div key={donor.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200 text-sm">
                                      <span className="font-medium">{donor.donor_name}</span>
                                      <span className="text-green-600 font-bold">IDR {donor.amount.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Donation Form */}
                        <div className="space-y-6">
                          <div className="text-center p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl border-2 border-pink-200">
                            <Sparkles className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                            <h4 className="text-xl font-bold text-gray-800 mb-2">Make Your Donation ✨</h4>
                            <p className="text-gray-600 text-sm">Every contribution makes a difference!</p>
                          </div>

                          <form onSubmit={handleDonate} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="donor_name" className="text-sm font-medium">Full Name *</Label>
                              <Input
                                id="donor_name"
                                placeholder="Enter your full name"
                                value={donationForm.donor_name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setDonationForm((prev: CreateDonationInput) => ({ ...prev, donor_name: e.target.value }))
                                }
                                required
                                className="border-2 focus:border-blue-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="donor_email" className="text-sm font-medium">Email (Optional)</Label>
                              <Input
                                id="donor_email"
                                type="email"
                                placeholder="your.email@example.com"
                                value={donationForm.donor_email || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setDonationForm((prev: CreateDonationInput) => ({ 
                                    ...prev, 
                                    donor_email: e.target.value || null 
                                  }))
                                }
                                className="border-2 focus:border-blue-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="donor_phone" className="text-sm font-medium">Phone (Optional)</Label>
                              <Input
                                id="donor_phone"
                                placeholder="Your phone number"
                                value={donationForm.donor_phone || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setDonationForm((prev: CreateDonationInput) => ({ 
                                    ...prev, 
                                    donor_phone: e.target.value || null 
                                  }))
                                }
                                className="border-2 focus:border-blue-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="amount" className="text-sm font-medium">Donation Amount (IDR) *</Label>
                              <Input
                                id="amount"
                                type="number"
                                placeholder="50000"
                                value={donationForm.amount || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setDonationForm((prev: CreateDonationInput) => ({ 
                                    ...prev, 
                                    amount: parseFloat(e.target.value) || 0 
                                  }))
                                }
                                min="1000"
                                step="1000"
                                required
                                className="border-2 focus:border-blue-500 text-lg font-semibold"
                              />
                              <div className="flex flex-wrap gap-2 mt-2">
                                {[25000, 50000, 100000, 250000, 500000].map((amount) => (
                                  <Button
                                    key={amount}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDonationForm(prev => ({ ...prev, amount }))}
                                    className="text-xs hover:bg-blue-50 hover:border-blue-300"
                                  >
                                    IDR {amount.toLocaleString()}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="message" className="text-sm font-medium">Message (Optional)</Label>
                              <Textarea
                                id="message"
                                placeholder="Leave an encouraging message for the campaign..."
                                value={donationForm.message || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                  setDonationForm((prev: CreateDonationInput) => ({ 
                                    ...prev, 
                                    message: e.target.value || null 
                                  }))
                                }
                                rows={3}
                                className="border-2 focus:border-blue-500"
                              />
                            </div>

                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <h5 className="font-semibold text-blue-800 mb-2">💳 Payment Instructions</h5>
                              <div className="text-sm text-blue-700 space-y-1">
                                <p><strong>Bank:</strong> Bank Central Asia (BCA)</p>
                                <p><strong>Account:</strong> 1234567890</p>
                                <p><strong>Name:</strong> DonateHeart Foundation</p>
                                <p className="text-xs text-blue-600 mt-2">
                                  ℹ️ After donation submission, please transfer the amount and your donation will be confirmed within 24 hours.
                                </p>
                              </div>
                            </div>

                            <Button
                              type="submit"
                              disabled={isDonating || !donationForm.donor_name || !donationForm.amount}
                              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg text-lg"
                            >
                              {isDonating ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Heart className="h-5 w-5 mr-2" />
                                  Donate IDR {donationForm.amount.toLocaleString()} 💝
                                </>
                              )}
                            </Button>
                          </form>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCampaigns.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No campaigns found</h3>
          <p>Try adjusting your search or check back later for new campaigns!</p>
        </div>
      )}
    </div>
  );
}
