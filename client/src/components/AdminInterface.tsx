
import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Target, 
  Users, 
  DollarSign,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Settings
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  Campaign, 
  Organization, 
  Donation,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  CreateCampaignInput,
  UpdateCampaignInput,
  UpdateDonationInput
} from '../../../server/src/schema';

interface AdminInterfaceProps {
  campaigns: Campaign[];
  organizations: Organization[];
  onRefresh: () => void;
}

export function AdminInterface({ campaigns, organizations, onRefresh }: AdminInterfaceProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Organization form state
  const [orgForm, setOrgForm] = useState<CreateOrganizationInput>({
    name: '',
    logo_url: null
  });
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState<CreateCampaignInput>({
    name: '',
    description: null,
    target_amount: 0,
    organization_id: 0,
    is_active: true
  });
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const loadDonations = useCallback(async () => {
    try {
      const donationsData = await trpc.getAllDonations.query();
      setDonations(donationsData);
    } catch (error) {
      console.error('Failed to load donations:', error);
    }
  }, []);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await trpc.createOrganization.mutate(orgForm);
      setOrgForm({ name: '', logo_url: null });
      onRefresh();
      alert('✅ Organization created successfully!');
    } catch (error) {
      console.error('Failed to create organization:', error);
      alert('❌ Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;

    try {
      setIsLoading(true);
      const updateData: UpdateOrganizationInput = {
        id: editingOrg.id,
        name: orgForm.name || undefined,
        logo_url: orgForm.logo_url || undefined
      };
      await trpc.updateOrganization.mutate(updateData);
      setEditingOrg(null);
      setOrgForm({ name: '', logo_url: null });
      onRefresh();
      alert('✅ Organization updated successfully!');
    } catch (error) {
      console.error('Failed to update organization:', error);
      alert('❌ Failed to update organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrganization = async (id: number) => {
    try {
      await trpc.deleteOrganization.mutate({ id });
      onRefresh();
      alert('✅ Organization deleted successfully!');
    } catch (error) {
      console.error('Failed to delete organization:', error);
      alert('❌ Failed to delete organization');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await trpc.createCampaign.mutate(campaignForm);
      setCampaignForm({
        name: '',
        description: null,
        target_amount: 0,
        organization_id: 0,
        is_active: true
      });
      onRefresh();
      alert('✅ Campaign created successfully!');
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('❌ Failed to create campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    try {
      setIsLoading(true);
      const updateData: UpdateCampaignInput = {
        id: editingCampaign.id,
        name: campaignForm.name || undefined,
        description: campaignForm.description || undefined,
        target_amount: campaignForm.target_amount || undefined,
        organization_id: campaignForm.organization_id || undefined,
        is_active: campaignForm.is_active
      };
      await trpc.updateCampaign.mutate(updateData);
      setEditingCampaign(null);
      setCampaignForm({
        name: '',
        description: null,
        target_amount: 0,
        organization_id: 0,
        is_active: true
      });
      onRefresh();
      alert('✅ Campaign updated successfully!');
    } catch (error) {
      console.error('Failed to update campaign:', error);
      alert('❌ Failed to update campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCampaign = async (id: number) => {
    try {
      await trpc.deleteCampaign.mutate({ id });
      onRefresh();
      alert('✅ Campaign deleted successfully!');
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      alert('❌ Failed to delete campaign');
    }
  };

  const handleUpdateDonationStatus = async (donationId: number, status: 'pending' | 'confirmed' | 'failed') => {
    try {
      const updateData: UpdateDonationInput = {
        id: donationId,
        payment_status: status
      };
      await trpc.updateDonation.mutate(updateData);
      await loadDonations();
      onRefresh();
      alert(`✅ Donation status updated to ${status}!`);
    } catch (error) {
      console.error('Failed to update donation:', error);
      alert('❌ Failed to update donation status');
    }
  };

  const getOrganizationName = useCallback((orgId: number) => {
    const org = organizations.find(o => o.id === orgId);
    return org?.name || 'Unknown Organization';
  }, [organizations]);

  const getCampaignName = useCallback((campaignId: number) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.name || 'Unknown Campaign';
  }, [campaigns]);

  const startEditOrganization = (org: Organization) => {
    setEditingOrg(org);
    setOrgForm({
      name: org.name,
      logo_url: org.logo_url
    });
  };

  const startEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      description: campaign.description,
      target_amount: campaign.target_amount,
      organization_id: campaign.organization_id,
      is_active: campaign.is_active
    });
  };

  // Statistics
  const totalRaised = campaigns.reduce((sum, c) => sum + c.current_amount, 0);
  const activeCampaignsCount = campaigns.filter(c => c.is_active).length;
  const totalDonors = donations.filter(d => d.payment_status === 'confirmed').length;

  const filteredDonations = donations.filter(donation =>
    donation.donor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getCampaignName(donation.campaign_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-2xl shadow-2xl">
        <div className="flex items-center space-x-4 mb-4">
          <Settings className="h-10 w-10" />
          <div>
            <h2 className="text-3xl font-bold">⚙️ Admin Dashboard</h2>
            <p className="opacity-90">Manage campaigns, organizations, and donations</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            📊 Overview
          </TabsTrigger>
          <TabsTrigger value="organizations" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            🏢 Organizations
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
            🎯 Campaigns
          </TabsTrigger>
          <TabsTrigger value="donations" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            💰 Donations
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Total Organizations</CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-800">{organizations.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Active Campaigns</CardTitle>
                <Target className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-800">{activeCampaignsCount}</div>
                <p className="text-xs text-green-600">{campaigns.length} total campaigns</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Total Donors</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-800">{totalDonors}</div>
                <p className="text-xs text-purple-600">Confirmed donations</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Total Raised</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-800">IDR {totalRaised.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Campaigns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span>Recent Campaigns</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.slice(0, 5).map((campaign: Campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-gray-600">{getOrganizationName(campaign.organization_id)}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={campaign.is_active ? "default" : "secondary"}>
                          {campaign.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round((campaign.current_amount / campaign.target_amount) * 100)}% funded
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Organizations List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-purple-500" />
                  <span>Organizations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {organizations.slice(0, 5).map((org: Organization) => (
                    <div key={org.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={org.logo_url || ''} alt={org.name} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold">
                          {org.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{org.name}</p>
                        <p className="text-sm text-gray-500">
                          {campaigns.filter(c => c.organization_id === org.id).length} campaigns
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Create/Edit Organization Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-blue-500" />
                  <span>{editingOrg ? 'Edit Organization' : 'Create New Organization'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingOrg ? handleUpdateOrganization : handleCreateOrganization} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Organization Name *</Label>
                    <Input
                      id="org-name"
                      placeholder="Enter organization name"
                      value={orgForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setOrgForm((prev: CreateOrganizationInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="org-logo">Logo URL (Optional)</Label>
                    <Input
                      id="org-logo"
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={orgForm.logo_url || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setOrgForm((prev: CreateOrganizationInput) => ({ 
                          ...prev, 
                          logo_url: e.target.value || null 
                        }))
                      }
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading || !orgForm.name}
                      className="flex-1"
                    >
                      {isLoading ? 'Saving...' : editingOrg ? 'Update Organization' : 'Create Organization'}
                    </Button>
                    {editingOrg && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setEditingOrg(null);
                          setOrgForm({ name: '', logo_url: null });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Organizations List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-purple-500" />
                  <span>All Organizations ({organizations.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {organizations.map((org: Organization) => (
                    <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={org.logo_url || ''} alt={org.name} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold">
                            {org.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{org.name}</h3>
                          <p className="text-sm text-gray-600">
                            {campaigns.filter(c => c.organization_id === org.id).length} campaigns
                          </p>
                          <p className="text-xs text-gray-500">
                            Created: {org.created_at.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditOrganization(org)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{org.name}"? This action cannot be undone and will affect all associated campaigns.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteOrganization(org.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Create/Edit Campaign Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-green-500" />
                  <span>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingCampaign ? handleUpdateCampaign : handleCreateCampaign} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-name">Campaign Name *</Label>
                    <Input
                      id="campaign-name"
                      placeholder="Enter campaign name"
                      value={campaignForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCampaignForm((prev: CreateCampaignInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="campaign-description">Description (Optional)</Label>
                    <Textarea
                      id="campaign-description"
                      placeholder="Describe the campaign goals and purpose"
                      value={campaignForm.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCampaignForm((prev: CreateCampaignInput) => ({ 
                          ...prev, 
                          description: e.target.value || null 
                        }))
                      }
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-amount">Target Amount (IDR) *</Label>
                    <Input
                      id="target-amount"
                      type="number"
                      placeholder="1000000"
                      value={campaignForm.target_amount || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCampaignForm((prev: CreateCampaignInput) => ({ 
                          ...prev, 
                          target_amount: parseFloat(e.target.value) || 0 
                        }))
                      }
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization *</Label>
                    <Select
                      value={campaignForm.organization_id.toString()}
                      onValueChange={(value) =>
                        setCampaignForm((prev: CreateCampaignInput) => ({ 
                          ...prev, 
                          organization_id: parseInt(value) 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org: Organization) => (
                          <SelectItem key={org.id} value={org.id.toString()}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-active"
                      checked={campaignForm.is_active}
                      onCheckedChange={(checked) =>
                        setCampaignForm((prev: CreateCampaignInput) => ({ ...prev, is_active: checked }))
                      }
                    />
                    <Label htmlFor="is-active">Campaign is active</Label>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading || !campaignForm.name || !campaignForm.target_amount || !campaignForm.organization_id}
                      className="flex-1"
                    >
                      {isLoading ? 'Saving...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                    </Button>
                    {editingCampaign && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setEditingCampaign(null);
                          setCampaignForm({
                            name: '',
                            description: null,
                            target_amount: 0,
                            organization_id: 0,
                            is_active: true
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Campaigns List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <span>All Campaigns ({campaigns.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {campaigns.map((campaign: Campaign) => {
                    const progress = Math.round((campaign.current_amount / campaign.target_amount) * 100);
                    
                    return (
                      <div key={campaign.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{campaign.name}</h3>
                              <Badge variant={campaign.is_active ? "default" : "secondary"}>
                                {campaign.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{getOrganizationName(campaign.organization_id)}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span>Target: IDR {campaign.target_amount.toLocaleString()}</span>
                              <span>Progress: {progress}%</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditCampaign(campaign)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{campaign.name}"? This action cannot be undone and will affect all associated donations.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCampaign(campaign.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Donations Tab */}
        <TabsContent value="donations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-orange-500" />
                  <span>Donation Management</span>
                </CardTitle>
                <Button onClick={loadDonations} size="sm" variant="outline">
                  Refresh Donations
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by donor name or campaign..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Donations Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Donor</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDonations.map((donation: Donation) => (
                      <TableRow key={donation.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{donation.donor_name}</p>
                            {donation.donor_email && (
                              <p className="text-xs text-gray-500">{donation.donor_email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{getCampaignName(donation.campaign_id)}</p>
                          {donation.message && (
                            <p className="text-xs text-gray-500 italic">"{donation.message}"</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-green-600">IDR {donation.amount.toLocaleString()}</p>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              donation.payment_status === 'confirmed' ? 'default' :
                              donation.payment_status === 'pending' ? 'secondary' : 'destructive'
                            }
                            className={
                              donation.payment_status === 'confirmed' ? 'bg-green-500' :
                              donation.payment_status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                            }
                          >
                            {donation.payment_status === 'confirmed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {donation.payment_status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {donation.payment_status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                            {donation.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{donation.created_at.toLocaleDateString()}</p>
                            {donation.confirmed_at && (
                              <p className="text-xs text-gray-500">
                                Confirmed: {donation.confirmed_at.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {donation.payment_status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:bg-green-50"
                                  onClick={() => handleUpdateDonationStatus(donation.id, 'confirmed')}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => handleUpdateDonationStatus(donation.id, 'failed')}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            {donation.payment_status === 'confirmed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-yellow-600 hover:bg-yellow-50"
                                onClick={() => handleUpdateDonationStatus(donation.id, 'pending')}
                              >
                                <Clock className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredDonations.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No donations found</h3>
                  <p>Donations will appear here once people start contributing to campaigns.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
