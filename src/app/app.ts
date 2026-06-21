import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from './Admin/Componet/layouts/sidebar/sidebar';
import { Header } from './Admin/Componet/layouts/header/header';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Sidebar,
    Header
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}