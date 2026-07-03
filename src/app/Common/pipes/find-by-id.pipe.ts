import { Pipe, PipeTransform } from '@angular/core';

/**
 * Finds an item in an array by its numeric `id` property.
 * Usage in template: `someArray | findById: numericId`
 */
@Pipe({
  name: 'findById',
  standalone: true,
  pure: true,
})
export class FindByIdPipe implements PipeTransform {
  transform(items: any[], id: number): any | null {
    if (!items || isNaN(id)) return null;
    return items.find(item => item.id === id) ?? null;
  }
}
