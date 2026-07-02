import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchQuerySource = new BehaviorSubject<string>(
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('adr_search_query')) || ''
  );
  searchQuery$ = this.searchQuerySource.asObservable();

  setSearchQuery(query: string): void {
    console.log('[SearchService] setSearchQuery called with:', query);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('adr_search_query', query);
    }
    this.searchQuerySource.next(query);
  }

  getSearchQuery(): string {
    console.log('[SearchService] getSearchQuery called, current value:', this.searchQuerySource.getValue());
    return this.searchQuerySource.getValue();
  }

}
