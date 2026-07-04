import { Injectable } from '@angular/core';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  raised: number;
  goal: number;
  percentage: number;
  items: string[];
}

export interface Contribution {
  id: number;
  donorName: string;
  donorEmail: string;
  campaignTitle: string;
  donationType: 'money' | 'supplies';
  amount?: number;
  supplies?: string[];
  time: string;
}

@Injectable({
  providedIn: 'root'
})
export class DonationService {
  private readonly CAMPAIGNS_KEY = 'adrms_campaigns';
  private readonly CONTRIBUTIONS_KEY = 'adrms_contributions';

  private defaultCampaigns: Campaign[] = [
    { id: 'C1', title: 'Western Province Flood Relief', description: 'Providing urgent food packets, dry rations, and clean drinking water to over 1,500 displaced families.', raised: 7200, goal: 10000, percentage: 72, items: ['Rice & Dhal', 'Water bottles', 'Dry rations'] },
    { id: 'C2', title: 'Emergency Medical Dispatch Fund', description: 'Procuring and transporting essential first-aid kits, life-saving medicines, and saline packets to medical camps.', raised: 4500, goal: 8000, percentage: 56, items: ['First-aid kits', 'Bandages', 'Antibiotics'] },
    { id: 'C3', title: 'Shelter Bedding & Warm Clothes', description: 'Sponsoring warm blankets, mattresses, and hygiene kits for children and the elderly housed in relief shelters.', raised: 9100, goal: 12000, percentage: 75, items: ['Blankets', 'Mattresses', 'Hygiene kits'] }
  ];

  private defaultContributions: Contribution[] = [
    { id: 1, donorName: 'Eshan Gunawardana', donorEmail: 'eshan@fema.org', campaignTitle: 'Western Province Flood Relief', donationType: 'money', amount: 250, time: '10 mins ago' },
    { id: 2, donorName: 'Lakshitha Dilshan', donorEmail: 'lakshitha@redcross.org', campaignTitle: 'Emergency Medical Dispatch Fund', donationType: 'supplies', supplies: ['First-aid kits', 'Bandages'], time: '25 mins ago' },
    { id: 3, donorName: 'Dulith Thenuka', donorEmail: 'dulith@nda.gov', campaignTitle: 'Shelter Bedding & Warm Clothes', donationType: 'money', amount: 500, time: '1 hour ago' }
  ];

  constructor() {
    if (!localStorage.getItem(this.CAMPAIGNS_KEY)) {
      localStorage.setItem(this.CAMPAIGNS_KEY, JSON.stringify(this.defaultCampaigns));
    }
    if (!localStorage.getItem(this.CONTRIBUTIONS_KEY)) {
      localStorage.setItem(this.CONTRIBUTIONS_KEY, JSON.stringify(this.defaultContributions));
    }
  }

  getCampaigns(): Campaign[] {
    const data = localStorage.getItem(this.CAMPAIGNS_KEY);
    return data ? JSON.parse(data) : this.defaultCampaigns;
  }

  getContributions(): Contribution[] {
    const data = localStorage.getItem(this.CONTRIBUTIONS_KEY);
    return data ? JSON.parse(data) : this.defaultContributions;
  }

  addContribution(
    campaignTitle: string,
    type: 'money' | 'supplies',
    donorName: string,
    donorEmail: string,
    value: number | string[]
  ): void {
    const campaigns = this.getCampaigns();
    const contributions = this.getContributions();

    // 1. Update Campaign metrics
    const campaign = campaigns.find(c => c.title === campaignTitle);
    if (campaign) {
      if (type === 'money') {
        campaign.raised += value as number;
        const newPct = Math.round((campaign.raised / campaign.goal) * 100);
        campaign.percentage = Math.min(newPct, 100);
      }
      localStorage.setItem(this.CAMPAIGNS_KEY, JSON.stringify(campaigns));
    }

    // 2. Add contribution record
    const newContrib: Contribution = {
      id: Date.now(),
      donorName,
      donorEmail,
      campaignTitle,
      donationType: type,
      amount: type === 'money' ? (value as number) : undefined,
      supplies: type === 'supplies' ? (value as string[]) : undefined,
      time: 'Just now'
    };

    contributions.unshift(newContrib);
    localStorage.setItem(this.CONTRIBUTIONS_KEY, JSON.stringify(contributions));
  }
}
