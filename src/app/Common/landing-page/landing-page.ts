import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LandingService } from '../services/landing.service';
import { LandingStats } from '../models/landing-stats.model';
import { ShelterService } from '../../services/shelter';
import { DonationService, Campaign, Contribution } from '../services/donation.service';
import { jsPDF } from 'jspdf';

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
  private donationService = inject(DonationService);
  private cdr = inject(ChangeDetectorRef);

  stats: LandingStats | null = null;
  loading = true;
  error = false;
  private pollInterval: any;

  
  showTicker = true;
  tickerMessage = '🚨 RED ALERT: Heavy rainfall exceeding 150mm expected in Western & Sabaragamuwa provinces. Flash flood warnings active.';

  
  searchQuery = '';
  allShelters = [
    { name: 'Colombo Central Relief Center', city: 'Colombo', capacity: '150/200 spaces', status: 'Open', contact: '0112 345 678', supplies: 'High food, low medical supplies' },
    { name: 'Galle Stadium Shelter', city: 'Galle', capacity: '90/100 spaces', status: 'Near Capacity', contact: '0912 234 567', supplies: 'Good supply level' },
    { name: 'Kandy Vihara Community Hall', city: 'Kandy', capacity: '45/120 spaces', status: 'Open', contact: '0812 345 123', supplies: 'Needs warm blankets' },
    { name: 'Negombo Town Hall', city: 'Negombo', capacity: '0/150 spaces', status: 'Closed', contact: '0312 222 333', supplies: 'No active stock' },
    { name: 'Matara Relief Camp', city: 'Matara', capacity: '130/150 spaces', status: 'Open', contact: '0412 277 888', supplies: 'High medical, low food supplies' }
  ];
  filteredShelters = [...this.allShelters];

 
  mapPoints = [
    { id: 1, name: 'Active Flood Area', type: 'incident', x: 30, y: 70, status: 'Critical', details: 'Severe flooding near Kelani River. Water levels rising. Evacuations in progress.' },
    { id: 2, name: 'Colombo Central Relief Center', type: 'shelter', x: 25, y: 65, status: 'Open (150/200)', details: 'Providing hot meals, clean water, first aid services. Medical personnel on standby.' },
    { id: 3, name: 'Landslide Warning Zone', type: 'incident', x: 50, y: 55, status: 'Warning', details: 'Red alert level landslide risk in Kadugannawa area. Residents advised to relocate.' },
    { id: 4, name: 'Kandy Vihara Community Hall', type: 'shelter', x: 55, y: 48, status: 'Open (45/120)', details: 'Safe shelter for residents in landslide-prone zones.' },
    { id: 5, name: 'Cyclone Impact Alert', type: 'incident', x: 75, y: 25, status: 'Critical', details: 'Gale force winds up to 80kmph reported. Tree fall clearance teams active.' },
    { id: 6, name: 'Galle Stadium Shelter', type: 'shelter', x: 32, y: 90, status: 'Near Capacity (90/100)', details: 'Near capacity. Supply trucks dispatched with extra food and sanitation kits.' }
  ];
  selectedPoint: any = this.mapPoints[0];

 
  donationCampaigns: Campaign[] = [];
  contributions: Contribution[] = [];

 
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
    this.loadCampaignsAndContributions();
    
    this.pollInterval = setInterval(() => {
      this.fetchStats();
      this.fetchShelters();
      this.loadCampaignsAndContributions();
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

  loadCampaignsAndContributions(): void {
    this.donationCampaigns = this.donationService.getCampaigns();
    this.contributions = this.donationService.getContributions();
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

    setTimeout(() => {
      const donationValue = this.donationType === 'money' ? this.donationAmount : this.selectedSupplies;
      this.donationService.addContribution(
        this.selectedCampaign.title,
        this.donationType,
        this.donorName,
        this.donorEmail,
        donationValue
      );

      this.donationLoading = false;
      this.donationSuccess = true;
      this.loadCampaignsAndContributions();
      this.cdr.detectChanges();
    }, 1500);
  }

 
  showShelterOnMap(shelterName: string): void {
    const point = this.mapPoints.find(p => 
      p.name.toLowerCase().includes(shelterName.toLowerCase()) || 
      shelterName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (point) {
      this.selectedPoint = point;
    }
    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth' });
    }
    this.cdr.detectChanges();
  }

  
  downloadGuide(): void {
    const guide = this.currentPreparednessGuide;
    if (!guide) return;
    
    const doc = new jsPDF();
    
   
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, 210, 8, 'F');

    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('GOVERNMENT OF SRI LANKA', 105, 20, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('DISASTER MANAGEMENT CENTER (DMC) - NATIONAL SAFETY AGENCY', 105, 26, { align: 'center' });

    
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 32, 195, 32);

    
    doc.setFontSize(15);
    doc.setTextColor(185, 28, 28); // Dark Red
    doc.text('EMERGENCY COMPLIANCE SAFETY CHECKLIST', 105, 42, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subject: Active Safety Guidelines for ${guide.title}`, 15, 52);
    doc.text(`Issued Date: ${new Date().toLocaleDateString()}`, 15, 58);
    doc.text('Status: Official & Government Verified for Citizen Compliance', 15, 64);

    
    doc.line(15, 70, 195, 70);
    doc.line(15, 71, 195, 71);

    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const descLines = doc.splitTextToSize(guide.description, 180);
    doc.text(descLines, 15, 78);

    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('MANDATORY COMPLIANCE STEPS:', 15, 96);

   
    let currentY = 104;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    
    guide.steps.forEach((step) => {
      
      doc.setDrawColor(148, 163, 184);
      doc.rect(15, currentY - 3.5, 4, 4);

     
      const stepText = doc.splitTextToSize(step, 168);
      doc.text(stepText, 23, currentY);
      
      currentY += (stepText.length * 5) + 3;
    });

    
    doc.setDrawColor(226, 232, 240);
    doc.line(15, currentY + 2, 195, currentY + 2);

    currentY += 8;
    
    doc.setFillColor(254, 242, 242);
    doc.rect(15, currentY, 180, 18, 'F');
    doc.setDrawColor(248, 113, 113);
    doc.rect(15, currentY, 180, 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(185, 28, 28);
    doc.text('OFFICIAL EMERGENCY HELPLINES:', 20, currentY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(127, 29, 29);
    doc.text(guide.emergencyContacts, 20, currentY + 12);

    currentY += 28;
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const authText = 'This checklist is compiled and distributed under the authority of the Disaster Management Act No. 13 of 2005. Non-compliance during active evacuation mandates may result in liability under civil protection directives.';
    const authLines = doc.splitTextToSize(authText, 180);
    doc.text(authLines, 15, currentY);

   
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('DMC NATIONAL CONTROL UNIT - ELECTRONICALLY SIGNED & VERIFIED', 105, currentY + 16, { align: 'center' });

    
    doc.save(`${this.activeGuide}_safety_guide_dmc_verified.pdf`);
  }

  
  showVolunteerModal = false;
  volName = '';
  volEmail = '';
  volPhone = '';
  volSkill = 'Medical Support';
  volSuccess = false;
  volLoading = false;
  localVolunteersAdded = 0;

  openVolunteerModal(): void {
    this.showVolunteerModal = true;
    this.volName = '';
    this.volEmail = '';
    this.volPhone = '';
    this.volSkill = 'Medical Support';
    this.volSuccess = false;
    this.volLoading = false;
    this.cdr.detectChanges();
  }

  closeVolunteerModal(): void {
    this.showVolunteerModal = false;
    this.cdr.detectChanges();
  }

  submitVolunteer(): void {
    if (!this.volName.trim() || !this.volEmail.trim() || !this.volPhone.trim()) {
      alert('Please fill out all volunteer details.');
      return;
    }

    this.volLoading = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.volLoading = false;
      this.volSuccess = true;
      this.localVolunteersAdded += 1;
      
      
      if (this.stats) {
        this.stats.volunteersActive += 1;
      }
      
      this.cdr.detectChanges();
    }, 1500);
  }
}