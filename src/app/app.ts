import { Component } from '@angular/core';

import { Sidebar } from './Admin/Componet/layouts/sidebar/sidebar';
import { Header } from './Admin/Componet/layouts/header/header';
import { Dashboard } from './Admin/Componet/pages/dashboard/dashboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Sidebar,
    Header,
    Dashboard
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}