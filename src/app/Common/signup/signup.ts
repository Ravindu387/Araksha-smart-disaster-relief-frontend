import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule], // Brings in [ngClass] and [(ngModel)]
  templateUrl: './signup.html'
})
export class SignupComponent {
  step: number = 1;
  selectedRole: string = '';

  user: any = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    agree: false
  };

  selectRole(role: string) {
    this.selectedRole = role;
  }

  nextStep() {
    if (!this.selectedRole) {
      alert('Please select a role');
      return;
    }

    // validate required fields
    if (
      !this.user.firstName ||
      !this.user.lastName ||
      !this.user.email ||
      !this.user.phone
    ) {
      alert('Please fill all required fields');
      return;
    }

    this.step = 2;
  }

  previousStep() {
    this.step = 1;
  }

  submitSignup() {
    if (!this.user.password) {
      alert('Please enter password');
      return;
    }

    if (!this.user.agree) {
      alert('You must agree to Terms & Privacy Policy');
      return;
    }

    const payload = {
      role: this.selectedRole,
      ...this.user
    };

    console.log('Signup Data:', payload);
    alert('Account created successfully!');
  }
}