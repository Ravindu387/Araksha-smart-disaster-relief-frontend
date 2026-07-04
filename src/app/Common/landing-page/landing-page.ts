import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LandingService } from '../services/landing.service';
import { LandingStats } from '../models/landing-stats.model';
import { ShelterService } from '../../services/shelter';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css'
})
export class LandingPage implements OnInit, OnDestroy {
  private landingService = inject(LandingService);
  private shelterService = inject(ShelterService);
  private cdr = inject(ChangeDetectorRef);

  stats: LandingStats | null = null;
  loading = true;
  error = false;
  private pollInterval: any;

  // 1. Ticker Banner
  showTicker = true;
  tickerMessage = '🚨 RED ALERT: Heavy rainfall exceeding 150mm expected in Western & Sabaragamuwa provinces. Flash flood warnings active.';

  // 2. Shelter Search Widget
  searchQuery = '';
  allShelters = [
    { name: 'Colombo Central Relief Center', city: 'Colombo', capacity: '150/200 spaces', status: 'Open', contact: '0112 345 678', supplies: 'High food, low medical supplies' },
    { name: 'Galle Stadium Shelter', city: 'Galle', capacity: '90/100 spaces', status: 'Near Capacity', contact: '0912 234 567', supplies: 'Good supply level' },
    { name: 'Kandy Vihara Community Hall', city: 'Kandy', capacity: '45/120 spaces', status: 'Open', contact: '0812 345 123', supplies: 'Needs warm blankets' },
    { name: 'Negombo Town Hall', city: 'Negombo', capacity: '0/150 spaces', status: 'Closed', contact: '0312 222 333', supplies: 'No active stock' },
    { name: 'Matara Relief Camp', city: 'Matara', capacity: '130/150 spaces', status: 'Open', contact: '0412 277 888', supplies: 'High medical, low food supplies' }
  ];
  filteredShelters = [...this.allShelters];

  // 3. Interactive SVG Map Points
  mapPoints = [
    { id: 1, name: 'Active Flood Area', type: 'incident', x: 30, y: 70, status: 'Critical', details: 'Severe flooding near Kelani River. Water levels rising. Evacuations in progress.' },
    { id: 2, name: 'Colombo Central Relief Center', type: 'shelter', x: 25, y: 65, status: 'Open (150/200)', details: 'Providing hot meals, clean water, first aid services. Medical personnel on standby.' },
    { id: 3, name: 'Landslide Warning Zone', type: 'incident', x: 50, y: 55, status: 'Warning', details: 'Red alert level landslide risk in Kadugannawa area. Residents advised to relocate.' },
    { id: 4, name: 'Kandy Vihara Community Hall', type: 'shelter', x: 55, y: 48, status: 'Open (45/120)', details: 'Safe shelter for residents in landslide-prone zones.' },
    { id: 5, name: 'Cyclone Impact Alert', type: 'incident', x: 75, y: 25, status: 'Critical', details: 'Gale force winds up to 80kmph reported. Tree fall clearance teams active.' },
    { id: 6, name: 'Galle Stadium Shelter', type: 'shelter', x: 32, y: 90, status: 'Near Capacity (90/100)', details: 'Near capacity. Supply trucks dispatched with extra food and sanitation kits.' }
  ];
  selectedPoint: any = this.mapPoints[0];

  // 4. Donation / Relief Campaigns
  donationCampaigns = [
    { title: 'Western Province Flood Relief', description: 'Providing urgent food packets, dry rations, and clean drinking water to over 1,500 displaced families.', raised: 7200, goal: 10000, percentage: 72, items: ['Rice & Dhal', 'Water bottles', 'Dry rations'] },
    { title: 'Emergency Medical Dispatch Fund', description: 'Procuring and transporting essential first-aid kits, life-saving medicines, and saline packets to medical camps.', raised: 4500, goal: 8000, percentage: 56, items: ['First-aid kits', 'Bandages', 'Antibiotics'] },
    { title: 'Shelter Bedding & Warm Clothes', description: 'Sponsoring warm blankets, mattresses, and hygiene kits for children and the elderly housed in relief shelters.', raised: 9100, goal: 12000, percentage: 75, items: ['Blankets', 'Mattresses', 'Hygiene kits'] }
  ];

  // 5. Safety & Preparedness Guides
  activeGuide = 'floods';
  preparednessGuides: { [key: string]: { title: string, description: string, steps: string[], emergencyContacts: string } } = {
    floods: {
      title: 'Flood Safety Guidelines',
      description: 'Follow these critical steps during severe storm alerts and rising river levels to ensure family safety.',
      steps: [
        'Move important valuables and electrical appliances to higher floors or elevated areas.',
        'Turn off main electricity breakers and gas valves immediately to prevent electrocution or fires.',
        'Do not attempt to walk, swim, or drive through moving floodwaters. Just 6 inches of water can sweep you away.',
        'Keep emergency communication devices fully charged and listen to local news bulletins regularly.'
      ],
      emergencyContacts: 'Disaster Management Center (DMC): 117 | Red Cross: 0112 501 221'
    },
    landslides: {
      title: 'Landslide Warning Guidelines',
      description: 'If you live on hilly slopes or landslide-prone zones, watch out for immediate warning signs.',
      steps: [
        'Watch for crack development in the ground, tilting trees, or sudden mud flow down slopes.',
        'Be alert for unusual sounds like trees cracking or boulders knocking together, signaling soil movement.',
        'Evacuate immediately to safe public assembly points if local authorities issue a red alert.',
        'Never return to a landslide area until safety geological teams declare it fully stabilized.'
      ],
      emergencyContacts: 'National Building Research Org (NBRO): 0112 588 307'
    },
    fires: {
      title: 'Fire Safety & Evacuation',
      description: 'Prepare your home, and know what to do instantly if a fire breaks out in your vicinity.',
      steps: [
        'Identify at least two escape routes out of every room in your building.',
        'If smoke is present, crawl low under the smoke to your exits to avoid inhaling toxic fumes.',
        'Touch doors with the back of your hand before opening. If hot, do not open—use your alternative exit.',
        'Once outside, stay outside. Call the fire department immediately and never re-enter for possessions.'
      ],
      emergencyContacts: 'Fire & Rescue Service: 110 | Police Emergency: 119'
    }
  };

  // 6. FAQs
  openFaqIndex: number | null = null;
  faqs = [
    { question: 'How do I report an active emergency?', answer: 'You can report an emergency by clicking the "🚨 Report Emergency" button on the landing page, registering a citizen account, and submitting the location and details of the incident. It is instantly dispatched to emergency services.' },
    { question: 'How can I register as a volunteer?', answer: 'Click on "Register Now" under the volunteer section. You can choose your skills (medical support, debris clearance, transport, food preparation) and location. Our smart engine will match you to emergency alerts in real time.' },
    { question: 'Is my personal data secure during reporting?', answer: 'Yes, ADRMS encrypts all communications. Personal information is only shared with authorized first responders and verified relief organizations managing your specific reported event.' },
    { question: 'Can I donate supplies instead of money?', answer: 'Absolutely! Each campaign shows a list of desired relief items. You can coordinate drop-offs with the campaign coordinators using the contact info listed on the dashboard.' }
  ];

  ngOnInit(): void {
    console.log('LandingPage ngOnInit called!');
    this.fetchStats();
    this.fetchShelters();
    // Poll every 5 seconds for real-time dashboard stats update
    this.pollInterval = setInterval(() => {
      this.fetchStats();
      this.fetchShelters();
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  fetchStats(): void {
    this.landingService.getLandingStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching landing page stats:', err);
        this.loading = false;
        this.error = true;
        this.cdr.detectChanges();
      }
    });
  }

  fetchShelters(): void {
    this.shelterService.getShelters().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.allShelters = data.map(s => {
            const cityPart = s.address ? (s.address.split(',')[0] || s.name) : s.name;
            return {
              name: s.name,
              city: cityPart,
              capacity: `${s.occupied || 0}/${s.capacity || 100} spaces`,
              status: s.status || 'Open',
              contact: '0112 136 136',
              supplies: s.amenities && s.amenities.length > 0 ? s.amenities.join(', ') : 'Adequate supply levels'
            };
          });
          this.filterShelters();
        }
      },
      error: (err) => {
        console.warn('Failed to load database shelters, using static fallbacks', err);
      }
    });
  }

  // Interactivity Methods
  filterShelters(): void {
    if (!this.searchQuery.trim()) {
      this.filteredShelters = [...this.allShelters];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredShelters = this.allShelters.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.city.toLowerCase().includes(query) ||
        s.supplies.toLowerCase().includes(query)
      );
    }
    this.cdr.detectChanges();
  }

  selectPoint(point: any): void {
    this.selectedPoint = point;
    this.cdr.detectChanges();
  }

  setGuide(category: string): void {
    this.activeGuide = category;
    this.cdr.detectChanges();
  }

  get currentPreparednessGuide(): { title: string; description: string; steps: string[]; emergencyContacts: string } {
    return this.preparednessGuides[this.activeGuide];
  }

  toggleFaq(index: number): void {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
    this.cdr.detectChanges();
  }

  // Donation Modal Interactivity
  showDonationModal = false;
  selectedCampaign: any = null;
  donationType: 'money' | 'supplies' = 'money';
  donationAmount = 50;
  selectedSupplies: string[] = [];
  donorName = '';
  donorEmail = '';
  donationLoading = false;
  donationSuccess = false;

  openDonationModal(campaign: any): void {
    this.selectedCampaign = campaign;
    this.showDonationModal = true;
    this.donationType = 'money';
    this.donationAmount = 50;
    this.selectedSupplies = [];
    this.donorName = '';
    this.donorEmail = '';
    this.donationSuccess = false;
    this.donationLoading = false;
    this.cdr.detectChanges();
  }

  closeDonationModal(): void {
    this.showDonationModal = false;
    this.selectedCampaign = null;
    this.cdr.detectChanges();
  }

  toggleSupply(item: string): void {
    const idx = this.selectedSupplies.indexOf(item);
    if (idx > -1) {
      this.selectedSupplies.splice(idx, 1);
    } else {
      this.selectedSupplies.push(item);
    }
    this.cdr.detectChanges();
  }

  submitDonation(): void {
    if (!this.donorName.trim() || !this.donorEmail.trim()) {
      alert('Please enter your name and email address.');
      return;
    }
    if (this.donationType === 'money' && (!this.donationAmount || this.donationAmount <= 0)) {
      alert('Please enter a valid donation amount.');
      return;
    }
    if (this.donationType === 'supplies' && this.selectedSupplies.length === 0) {
      alert('Please select at least one supply item to coordinate.');
      return;
    }

    this.donationLoading = true;
    this.cdr.detectChanges();

    // Mock API transaction delay
    setTimeout(() => {
      this.donationLoading = false;
      this.donationSuccess = true;
      
      // Update raised statistics dynamically for the local session
      if (this.donationType === 'money') {
        this.selectedCampaign.raised += this.donationAmount;
        const newPct = Math.round((this.selectedCampaign.raised / this.selectedCampaign.goal) * 100);
        this.selectedCampaign.percentage = Math.min(newPct, 100);
      }
      
      this.cdr.detectChanges();
    }, 1500);
  }
}