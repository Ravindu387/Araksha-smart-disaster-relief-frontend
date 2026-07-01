import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Inventory } from './inventory';
import { InventoryService } from '../../../../Common/services/inventory.service';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('Inventory', () => {
  let component: Inventory;
  let fixture: ComponentFixture<Inventory>;
  let mockInventoryService: any;

  beforeEach(async () => {
    mockInventoryService = {
      getAllInventory: () => of([]),
      addInventory: () => of({})
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, Inventory],
      providers: [
        { provide: InventoryService, useValue: mockInventoryService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Inventory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});