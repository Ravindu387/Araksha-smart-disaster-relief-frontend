import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CitizenService } from '../../../../Common/services/citizen.service';
import { Citizen } from '../../../../Common/models/citizen';
import { Icon } from '../../../../Common/icon/icon';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-citizens',
  standalone: true,
  imports: [CommonModule, FormsModule, Icon],
  templateUrl: './citizens.html'
})
export class CitizensComponent implements OnInit, OnDestroy {
  private citizenService = inject(CitizenService);
  private cdr = inject(ChangeDetectorRef);

  allCitizens: Citizen[] = [];
  filteredCitizens: Citizen[] = [];
  pagedCitizens: Citizen[] = [];
  isLoading = false;
  actionSuccess = '';
  actionError = '';

  searchQuery = '';
  private searchSubject = new Subject<string>();
  private searchSub = new Subscription();

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  viewModalOpen = false;
  viewingCitizen: Citizen | null = null;

  editModalOpen = false;
  editingCitizen: Citizen | null = null;
  editFullName = '';
  editEmail = '';
  editPhone = '';
  editAddress = '';
  editSaving = false;
  editError = '';

  createModalOpen = false;
  createFullName = '';
  createEmail = '';
  createPhone = '';
  createAddress = '';
  createSaving = false;
  createError = '';

  deletingId: number | null = null;

  ngOnInit(): void {
    this.loadCitizens();
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(q => {
      this.searchQuery = q;
      this.applyFilter();
    });
  }

  ngOnDestroy(): void {
    this.searchSub.unsubscribe();
  }

  loadCitizens(): void {
    this.isLoading = true;
    this.citizenService.getAllCitizens().subscribe({
      next: (citizens) => {
        this.allCitizens = citizens.sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load citizens:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredCitizens = !q ? [...this.allCitizens] :
      this.allCitizens.filter(c =>
        c.fullName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phoneNumber?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q)
      );
    this.currentPage = 1;
    this.totalPages = Math.max(1, Math.ceil(this.filteredCitizens.length / this.pageSize));
    this.updatePage();
  }

  updatePage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedCitizens = this.filteredCitizens.slice(start, start + this.pageSize);
    this.cdr.detectChanges();
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePage();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = [
      'bg-violet-100 text-violet-700',
      'bg-blue-100 text-blue-700',
      'bg-emerald-100 text-emerald-700',
      'bg-rose-100 text-rose-700',
      'bg-amber-100 text-amber-700',
      'bg-cyan-100 text-cyan-700',
      'bg-indigo-100 text-indigo-700',
      'bg-pink-100 text-pink-700',
    ];
    const idx = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[idx];
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  openView(citizen: Citizen): void {
    this.viewingCitizen = citizen;
    this.viewModalOpen = true;
  }

  closeView(): void {
    this.viewModalOpen = false;
    this.viewingCitizen = null;
  }

  openEdit(citizen: Citizen): void {
    this.editingCitizen = citizen;
    this.editFullName = citizen.fullName;
    this.editEmail = citizen.email;
    this.editPhone = citizen.phoneNumber;
    this.editAddress = citizen.address;
    this.editError = '';
    this.editSaving = false;
    this.editModalOpen = true;
  }

  closeEdit(): void {
    this.editModalOpen = false;
    this.editingCitizen = null;
    this.editError = '';
    this.editSaving = false;
  }

  submitEdit(): void {
    if (!this.editingCitizen) return;
    if (!this.editFullName.trim() || !this.editEmail.trim()) {
      this.editError = 'Full name and email are required.';
      return;
    }
    this.editSaving = true;
    this.editError = '';
    const payload: Citizen = {
      id: this.editingCitizen.id,
      fullName: this.editFullName.trim(),
      email: this.editEmail.trim(),
      phoneNumber: this.editPhone.trim(),
      address: this.editAddress.trim(),
      createdAt: this.editingCitizen.createdAt
    };
    this.citizenService.updateCitizen(this.editingCitizen.id, payload).subscribe({
      next: () => {
        this.editSaving = false;
        this.actionSuccess = `"${payload.fullName}" updated successfully.`;
        setTimeout(() => { this.actionSuccess = ''; }, 3000);
        this.closeEdit();
        this.loadCitizens();
      },
      error: (err) => {
        console.error(err);
        this.editSaving = false;
        this.editError = 'Failed to update citizen. Please try again.';
      }
    });
  }

  openCreate(): void {
    this.createFullName = '';
    this.createEmail = '';
    this.createPhone = '';
    this.createAddress = '';
    this.createError = '';
    this.createSaving = false;
    this.createModalOpen = true;
  }

  closeCreate(): void {
    this.createModalOpen = false;
    this.createError = '';
    this.createSaving = false;
  }

  submitCreate(): void {
    if (!this.createFullName.trim() || !this.createEmail.trim()) {
      this.createError = 'Full name and email are required.';
      return;
    }
    this.createSaving = true;
    this.createError = '';
    const payload: any = {
      fullName: this.createFullName.trim(),
      email: this.createEmail.trim(),
      phoneNumber: this.createPhone.trim(),
      address: this.createAddress.trim()
    };
    this.citizenService.createCitizen(payload).subscribe({
      next: () => {
        this.createSaving = false;
        this.actionSuccess = `"${payload.fullName}" registered successfully.`;
        setTimeout(() => { this.actionSuccess = ''; }, 3000);
        this.closeCreate();
        this.loadCitizens();
      },
      error: (err) => {
        console.error(err);
        this.createSaving = false;
        this.createError = 'Failed to register citizen. Please try again.';
      }
    });
  }

  deleteCitizen(citizen: Citizen): void {
    if (this.deletingId === citizen.id) return;
    this.deletingId = citizen.id;
    this.citizenService.deleteCitizen(citizen.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.actionSuccess = `"${citizen.fullName}" removed.`;
        setTimeout(() => { this.actionSuccess = ''; }, 3000);
        this.loadCitizens();
      },
      error: (err) => {
        console.error(err);
        this.deletingId = null;
        this.actionError = `Failed to delete "${citizen.fullName}".`;
        setTimeout(() => { this.actionError = ''; }, 4000);
      }
    });
  }

  exportCsv(): void {
    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Address', 'Registered'];
    const rows = this.filteredCitizens.map(c => [
      c.id,
      `"${(c.fullName || '').replace(/"/g, '""')}"`,
      c.email,
      c.phoneNumber,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      this.formatDate(c.createdAt)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citizens-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
